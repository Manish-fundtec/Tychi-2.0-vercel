'use client'

import { useEffect, useState, useMemo } from 'react'
import { Modal, Button, Row, Col, Table, Spinner, Alert } from 'react-bootstrap'
import Cookies from 'js-cookie'

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

export default function MigrationComparisonModal({ show, onClose, fundId }) {
  const [lastPricingDate, setLastPricingDate] = useState(null)
  const [trialBalanceData, setTrialBalanceData] = useState([])
  const [uploadedData, setUploadedData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

        // Normalize trial balance data
        const data = (json?.data || json?.rows || [])
          .map((r) => ({
            glNumber: String(r.glNumber ?? r.glnumber ?? r.gl_code ?? '').trim(),
            glName: String(r.glName ?? r.gl_name ?? '').trim(),
            opening: Number(r.opening_balance ?? r.openingbalance ?? 0),
            debit: Number(r.debit_amount ?? r.debit ?? 0),
            credit: Number(r.credit_amount ?? r.credit ?? 0),
            closing: Number(r.closing_balance ?? r.closingbalance ?? 0),
          }))
          .filter((item) => item.glNumber && isAllowedGlCode(item.glNumber)) // Filter by allowed GL code ranges

        setTrialBalanceData(data)
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
        const url = `${apiBase}/api/v1/migration/trialbalance/${encodeURIComponent(fundId)}`
        const resp = await fetch(url, { headers, credentials: 'include' })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()

        // Normalize uploaded migration data
        const data = (json?.data || json?.rows || [])
          .map((r) => ({
            glNumber: String(r.account_code ?? r.gl_code ?? r.glNumber ?? '').trim(),
            glName: String(r.account_name ?? r.gl_name ?? r.accountName ?? '').trim(),
            opening: Number(r.opening_balance ?? r.opening ?? 0),
            debit: Number(r.debit ?? r.debit_amount ?? 0),
            credit: Number(r.credit ?? r.credit_amount ?? 0),
            closing: Number(r['Closing balance'] ?? r.closing_balance ?? r.closing ?? 0),
          }))
          .filter((item) => item.glNumber && isAllowedGlCode(item.glNumber)) // Filter by allowed GL code ranges

        setUploadedData(data)
      } catch (e) {
        console.error('[MigrationComparison] Failed to fetch uploaded data:', e)
        setError('Failed to load uploaded migration data')
        setUploadedData([])
      } finally {
        setLoading(false)
      }
    }

    fetchUploadedData()
  }, [show, fundId])

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

  return (
    <Modal show={show} onHide={onClose} size="xl" centered scrollable>
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
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={() => {}} disabled={!canReconcile || loading}>
          Reconcile
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

