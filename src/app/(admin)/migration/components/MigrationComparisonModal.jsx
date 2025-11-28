'use client'

import { useEffect, useState, useMemo } from 'react'
import { Modal, Button, Row, Col, Table, Spinner, Alert } from 'react-bootstrap'
import Cookies from 'js-cookie'
import { markMigrationAsPending } from '@/lib/api/migration'

const apiBase = process.env.NEXT_PUBLIC_API_URL || ''

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken')
  const h = { Accept: 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

const fmt = (v) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Helper function to check if GL code is in allowed ranges (13000-13999 or 21000-21999)
const isAllowedGlCode = (glCode) => {
  const code = Number(glCode)
  if (!Number.isFinite(code)) return false
  return (code >= 13000 && code <= 13999) || (code >= 21000 && code <= 21999)
}

export default function MigrationComparisonModal({ show, onClose, fundId, fileId, onRefreshHistory }) {
  const [lastPricingDate, setLastPricingDate] = useState(null)
  const [trialBalanceData, setTrialBalanceData] = useState([])
  const [allTrialBalanceData, setAllTrialBalanceData] = useState([]) // All GL codes for reconcile modal
  const [uploadedData, setUploadedData] = useState([])
  const [allUploadedData, setAllUploadedData] = useState([]) // All GL codes for reconcile modal
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showReconcileModal, setShowReconcileModal] = useState(false)

  // Fetch last pricing date
  useEffect(() => {
    if (!show || !fundId) return

    const fetchLastPricingDate = async () => {
      try {
        const url = `${apiBase}/api/v1/pricing/lastPricingdate/${encodeURIComponent(fundId)}`
        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()
        const lastDate =
          json?.last_pricing_date ||
          json?.meta?.last_pricing_date ||
          json?.data?.last_pricing_date ||
          json?.result?.last_pricing_date ||
          null
        setLastPricingDate(lastDate ? lastDate.slice(0, 10) : null)
      } catch (e) {
        console.error('[MigrationComparison] Failed to fetch last pricing date:', e)
        setError('Failed to load last pricing date')
      }
    }

    fetchLastPricingDate()
  }, [show, fundId])

  // Fetch Trial Balance MTD for last pricing date
  useEffect(() => {
    if (!show || !fundId || !lastPricingDate) return

    const fetchTrialBalance = async () => {
      try {
        setLoading(true)
        setError('')
        const params = new URLSearchParams()
        params.set('date', lastPricingDate)
        params.set('scope', 'MTD')
        const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl-trial?${params.toString()}`
        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()

        // Normalize trial balance data - NO FILTER for comparison modal (all GL codes)
        const allData = (json?.data || json?.rows || [])
          .map((r) => ({
            glNumber: String(r.glNumber ?? r.glnumber ?? r.gl_code ?? '').trim(),
            glName: String(r.glName ?? r.gl_name ?? '').trim(),
            opening: Number(r.opening_balance ?? r.openingbalance ?? 0),
            debit: Number(r.debit_amount ?? r.debit ?? 0),
            credit: Number(r.credit_amount ?? r.credit ?? 0),
            closing: Number(r.closing_balance ?? r.closingbalance ?? 0),
          }))
          .filter((item) => item.glNumber) // Only filter empty GL codes

        // For comparison modal display, filter by allowed ranges
        const filteredData = allData.filter((item) => isAllowedGlCode(item.glNumber))
        setTrialBalanceData(filteredData)
        
        // Store all data for reconcile modal (no filter)
        setAllTrialBalanceData(allData)
      } catch (e) {
        console.error('[MigrationComparison] Failed to fetch trial balance:', e)
        setError('Failed to load trial balance data')
        setTrialBalanceData([])
      } finally {
        setLoading(false)
      }
    }

    fetchTrialBalance()
  }, [show, fundId, lastPricingDate])

  // Fetch uploaded migration data
  useEffect(() => {
    if (!show || !fundId) return

    const fetchUploadedData = async () => {
      try {
        setLoading(true)
        const token = Cookies.get('dashboardToken')
        const headers = {
          ...getAuthHeaders(),
          'dashboard': `Bearer ${token}`, // Add dashboard token like uploadTrade
        }
        // If fileId is provided, fetch data for that specific file, otherwise fetch latest
        let url = `${apiBase}/api/v1/migration/trialbalance/${encodeURIComponent(fundId)}`
        if (fileId) {
          url += `?file_id=${encodeURIComponent(fileId)}`
        }
        const resp = await fetch(url, { headers, credentials: 'include' })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()

        // Updated response format: { data: [...] }
        const responseData = json?.data || []

        // Normalize uploaded migration data - Map fields as per new API format
        // Fields: account_code, account_name, opening_balance (null), debit, credit, "Closing balance"
        const allData = responseData
          .map((r) => ({
            glNumber: String(r.account_code ?? r.gl_code ?? r.glNumber ?? '').trim(),
            glName: String(r.account_name ?? r.gl_name ?? r.accountName ?? '').trim(),
            opening: Number(r.opening_balance ?? r.opening ?? 0), // Can be null, default to 0
            debit: Number(r.debit ?? r.debit_amount ?? 0),
            credit: Number(r.credit ?? r.credit_amount ?? 0),
            closing: Number(r['Closing balance'] ?? r.closing_balance ?? r.closing ?? 0), // Note: "Closing balance" with space and capital C
          }))
          .filter((item) => item.glNumber) // Only filter empty GL codes

        // For comparison modal display, filter by allowed ranges
        const filteredData = allData.filter((item) => isAllowedGlCode(item.glNumber))
        setUploadedData(filteredData)
        
        // Store all data for reconcile modal (no filter)
        setAllUploadedData(allData)
      } catch (e) {
        console.error('[MigrationComparison] Failed to fetch uploaded data:', e)
        setError('Failed to load uploaded migration data')
        setUploadedData([])
      } finally {
        setLoading(false)
      }
    }

    fetchUploadedData()
  }, [show, fundId, fileId])

  // Create merged comparison data with difference calculation
  const comparisonData = useMemo(() => {
    const merged = new Map()

    // Add trial balance data
    trialBalanceData.forEach((item) => {
      const key = item.glNumber
      merged.set(key, {
        glNumber: key,
        glName: item.glName,
        trialBalance: item,
        uploaded: null,
      })
    })

    // Add uploaded data
    uploadedData.forEach((item) => {
      const key = item.glNumber
      if (merged.has(key)) {
        merged.get(key).uploaded = item
      } else {
        merged.set(key, {
          glNumber: key,
          glName: item.glName,
          trialBalance: null,
          uploaded: item,
        })
      }
    })

    // Calculate difference for each row (Trial Balance closing - Uploaded closing)
    const data = Array.from(merged.values()).map((item) => {
      const trialClosing = item.trialBalance?.closing ?? 0
      const uploadedClosing = item.uploaded?.closing ?? 0
      const difference = trialClosing - uploadedClosing
      return {
        ...item,
        difference,
      }
    })

    return data.sort((a, b) => a.glNumber.localeCompare(b.glNumber))
  }, [trialBalanceData, uploadedData])

  // Check if all differences are 0 (allow small floating point errors)
  const canReconcile = useMemo(() => {
    if (comparisonData.length === 0) return false
    return comparisonData.every((item) => Math.abs(item.difference) < 0.01)
  }, [comparisonData])

  // Simple function to mark migration as PENDING when user closes modal
  const handleClose = async () => {
    // Call API to change status from uploaded to pending
    if (fundId) {
      try {
        const response = await markMigrationAsPending(fundId, fileId)
        // Updated response format: { success: true, message: "..." }
        if (response.data.success) {
          // Refresh history after marking as pending
          if (onRefreshHistory) {
            onRefreshHistory()
          }
        } else {
          // Handle error response: { success: false, message: "..." }
          const errorMsg = response.data.message || 'Failed to mark as pending'
          console.error('Failed to mark migration as PENDING:', errorMsg)
          if (onRefreshHistory) {
            onRefreshHistory()
          }
        }
      } catch (error) {
        console.error('Failed to mark migration as PENDING:', error)
        const errorMsg = error?.response?.data?.message || error?.message || 'Failed to mark as pending'
        // Still refresh history even if API fails
        if (onRefreshHistory) {
          onRefreshHistory()
        }
      }
    }
    // Close the modal
    onClose()
  }

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Migration Data Comparison</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {lastPricingDate && (
          <div className="mb-3">
            <strong>Last Pricing Date:</strong> {lastPricingDate}
          </div>
        )}

        {loading ? (
          <div className="d-flex align-items-center justify-content-center p-5">
            <Spinner animation="border" className="me-2" />
            <span>Loading comparison data...</span>
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <Table striped bordered hover size="sm">
              <thead className="table-light sticky-top">
                <tr>
                  <th rowSpan={2}>GL Code</th>
                  <th rowSpan={2}>GL Name</th>
                  <th colSpan={4} className="text-center">
                    Trial Balance MTD (Last Pricing)
                  </th>
                  <th colSpan={4} className="text-center">
                    Uploaded Migration Data
                  </th>
                  <th rowSpan={2} className="text-center">
                    Difference
                  </th>
                </tr>
                <tr>
                  {/* Trial Balance columns */}
                  <th className="text-end">Opening</th>
                  <th className="text-end">Debit</th>
                  <th className="text-end">Credit</th>
                  <th className="text-end">Closing</th>
                  {/* Uploaded Data columns */}
                  <th className="text-end">Opening</th>
                  <th className="text-end">Debit</th>
                  <th className="text-end">Credit</th>
                  <th className="text-end">Closing</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center text-muted">
                      No comparison data available
                    </td>
                  </tr>
                ) : (
                  comparisonData.map((row, idx) => {
                    const trialBal = row.trialBalance
                    const uploaded = row.uploaded
                    const diff = row.difference
                    // Green if difference is 0, red if not 0
                    const diffClass = Math.abs(diff) < 0.01 ? 'text-success' : 'text-danger'

                    return (
                      <tr key={idx}>
                        <td>{row.glNumber}</td>
                        <td>{row.glName}</td>
                        {/* Trial Balance columns */}
                        <td className="text-end">{trialBal ? fmt(trialBal.opening) : '—'}</td>
                        <td className="text-end">{trialBal ? fmt(trialBal.debit) : '—'}</td>
                        <td className="text-end">{trialBal ? fmt(trialBal.credit) : '—'}</td>
                        <td className="text-end">{trialBal ? fmt(trialBal.closing) : '—'}</td>
                        {/* Uploaded Data columns */}
                        <td className="text-end">{uploaded ? fmt(uploaded.opening) : '—'}</td>
                        <td className="text-end">{uploaded ? fmt(uploaded.debit) : '—'}</td>
                        <td className="text-end">{uploaded ? fmt(uploaded.credit) : '—'}</td>
                        <td className="text-end">{uploaded ? fmt(uploaded.closing) : '—'}</td>
                        {/* Difference column - green if 0, red if not 0 */}
                        <td className={`text-end fw-bold ${diffClass}`}>
                          {fmt(diff)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={() => setShowReconcileModal(true)} disabled={!canReconcile || loading}>
          Reconcile
        </Button>
      </Modal.Footer>

      {/* Reconcile Modal */}
      <ReconcileModal
        show={showReconcileModal}
        onClose={() => setShowReconcileModal(false)}
        onPublish={() => {
          // TODO: Implement publish logic
          alert('Publish functionality will be implemented')
          setShowReconcileModal(false)
        }}
        trialBalanceData={allTrialBalanceData}
        uploadedData={allUploadedData}
        fundId={fundId}
        lastPricingDate={lastPricingDate}
      />
    </Modal>
  )
}

// Reconcile Modal Component
function ReconcileModal({ show, onClose, onPublish, trialBalanceData, uploadedData, fundId, lastPricingDate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPublishReviewModal, setShowPublishReviewModal] = useState(false)

  // Calculate closing balances and differences - ALL GL CODES (no filter)
  const reconcileData = useMemo(() => {
    const merged = new Map()

    // Add trial balance data (from report) - ALL GL codes
    trialBalanceData.forEach((item) => {
      merged.set(item.glNumber, {
        glNumber: item.glNumber,
        glName: item.glName,
        reportClosing: item.closing,
        uploadedClosing: null,
        difference: null,
      })
    })

    // Add uploaded data and calculate differences - ALL GL codes
    uploadedData.forEach((item) => {
      const key = item.glNumber
      if (merged.has(key)) {
        const existing = merged.get(key)
        existing.uploadedClosing = item.closing
        existing.difference = existing.reportClosing - item.closing
      } else {
        merged.set(key, {
          glNumber: key,
          glName: item.glName,
          reportClosing: null,
          uploadedClosing: item.closing,
          difference: null,
        })
      }
    })

    return Array.from(merged.values())
      .filter((item) => item.reportClosing !== null && item.uploadedClosing !== null)
      .sort((a, b) => a.glNumber.localeCompare(b.glNumber))
  }, [trialBalanceData, uploadedData])

  // Calculate totals (calculated closing balance)
  const totals = useMemo(() => {
    // Calculate total closing balance from all accounts
    const reportTotal = reconcileData.reduce((sum, item) => sum + (item.reportClosing || 0), 0)
    const uploadedTotal = reconcileData.reduce((sum, item) => sum + (item.uploadedClosing || 0), 0)
    const differenceTotal = reportTotal - uploadedTotal

    return {
      reportTotal,
      uploadedTotal,
      differenceTotal,
    }
  }, [reconcileData])

  const handlePublish = async () => {
    if (!canPublish) {
      alert('Cannot publish: There are differences in closing balances. Please reconcile first.')
      return
    }

    // Open publish review modal instead of directly publishing
    setShowPublishReviewModal(true)
  }

  const canPublish = useMemo(() => {
    return reconcileData.every((item) => Math.abs(item.difference || 0) < 0.01)
  }, [reconcileData])

  return (
    <Modal show={show} onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Reconcile Migration Data</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {lastPricingDate && (
          <div className="mb-3">
            <strong>Last Pricing Date:</strong> {lastPricingDate}
          </div>
        )}

        <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <Table striped bordered hover size="sm">
            <thead className="table-light sticky-top">
              <tr>
                <th>GL Code</th>
                <th>GL Name</th>
                <th className="text-end">Report Closing Balance</th>
                <th className="text-end">Uploaded Closing Balance</th>
                <th className="text-end">Difference</th>
              </tr>
            </thead>
            <tbody>
              {reconcileData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    No data to reconcile
                  </td>
                </tr>
              ) : (
                <>
                  {reconcileData.map((row, idx) => {
                    const diff = row.difference || 0
                    const diffClass = Math.abs(diff) < 0.01 ? 'text-success' : 'text-danger'
                    return (
                      <tr key={idx}>
                        <td>{row.glNumber}</td>
                        <td>{row.glName}</td>
                        <td className="text-end">{fmt(row.reportClosing || 0)}</td>
                        <td className="text-end">{fmt(row.uploadedClosing || 0)}</td>
                        <td className={`text-end fw-bold ${diffClass}`}>{fmt(diff)}</td>
                      </tr>
                    )
                  })}
                  {/* Calculated Closing Balance Totals row */}
                  <tr className="table-primary fw-bold">
                    <td colSpan={2}>Calculated Closing Balance</td>
                    <td className="text-end">{fmt(totals.reportTotal)}</td>
                    <td className="text-end">{fmt(totals.uploadedTotal)}</td>
                    <td className={`text-end ${Math.abs(totals.differenceTotal) < 0.01 ? 'text-success' : 'text-danger'}`}>
                      {fmt(totals.differenceTotal)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Close
        </Button>
        <Button variant="primary" onClick={handlePublish} disabled={!canPublish || loading}>
          {loading ? 'Publishing...' : 'Publish'}
        </Button>
      </Modal.Footer>

      {/* Publish Review Modal */}
      <PublishReviewModal
        show={showPublishReviewModal}
        onClose={() => setShowPublishReviewModal(false)}
        onReview={() => {
          setShowPublishReviewModal(false)
          // Stay on reconcile modal for review
        }}
        onConfirmPublish={async () => {
          setLoading(true)
          setError('')
          try {
            // TODO: Call API to publish/reconcile migration data
            // const url = `${apiBase}/api/v1/migration/reconcile`
            // const resp = await fetch(url, { ... })
            
            // For now, just call onPublish callback
            onPublish()
            setShowPublishReviewModal(false)
            onClose() // Close reconcile modal after publish
          } catch (e) {
            console.error('[ReconcileModal] Publish failed:', e)
            setError('Failed to publish migration data')
          } finally {
            setLoading(false)
          }
        }}
        totals={totals}
        lastPricingDate={lastPricingDate}
      />
    </Modal>
  )
}

// Publish Review Modal Component
function PublishReviewModal({ show, onClose, onReview, onConfirmPublish, totals, lastPricingDate }) {
  return (
    <Modal show={show} onHide={onClose} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>Publish Review</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {lastPricingDate && (
          <div className="mb-3">
            <strong>Last Pricing Date:</strong> {lastPricingDate}
          </div>
        )}

        <div className="table-responsive">
          <Table striped bordered hover size="sm">
            <thead className="table-light">
              <tr>
                <th>Description</th>
                <th className="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Trial Balance Closing Balance</strong></td>
                <td className="text-end fw-bold">{fmt(totals.reportTotal)}</td>
              </tr>
              <tr>
                <td><strong>Uploaded Data Closing Balance</strong></td>
                <td className="text-end fw-bold">{fmt(totals.uploadedTotal)}</td>
              </tr>
              <tr className={Math.abs(totals.differenceTotal) < 0.01 ? 'table-success' : 'table-danger'}>
                <td><strong>Difference</strong></td>
                <td className={`text-end fw-bold ${Math.abs(totals.differenceTotal) < 0.01 ? 'text-success' : 'text-danger'}`}>
                  {fmt(totals.differenceTotal)}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>

        {Math.abs(totals.differenceTotal) >= 0.01 && (
          <Alert variant="warning" className="mt-3">
            <strong>Warning:</strong> There is a difference between Trial Balance and Uploaded Data closing balances.
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="info" onClick={onReview}>
          Review
        </Button>
        <Button variant="primary" onClick={onConfirmPublish} disabled={Math.abs(totals.differenceTotal) >= 0.01}>
          Confirm Publish
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

