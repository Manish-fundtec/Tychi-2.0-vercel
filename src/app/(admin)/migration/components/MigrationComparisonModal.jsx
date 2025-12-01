'use client'

import { useEffect, useState, useMemo } from 'react'
import { Modal, Button, Row, Col, Table, Spinner, Alert } from 'react-bootstrap'
import Cookies from 'js-cookie'
import { markMigrationAsPending } from '@/lib/api/migration'
import { useDashboardToken } from '@/hooks/useDashboardToken'

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

// Helper function to determine GL code nature (debit or credit)
const getGlNature = (glCode) => {
  const code = Number(glCode)
  if (!Number.isFinite(code)) return 'debit' // default
  if (code >= 10000 && code < 20000) return 'debit' // Assets
  if (code >= 20000 && code < 30000) return 'credit' // Liabilities
  if (code >= 30000 && code < 40000) return 'credit' // Equity
  if (code >= 40000 && code < 50000) return 'credit' // Income
  if (code >= 50000 && code <= 60000) return 'debit' // Expenses
  return 'debit' // default
}

// Convert closing balance to debit/credit based on GL nature
const convertToDebitCredit = (closingBalance, glCode) => {
  const nature = getGlNature(glCode)
  const balance = Number(closingBalance || 0)
  
  if (nature === 'debit') {
    // Debit nature: positive = debit, negative = credit
    return {
      debit: balance >= 0 ? balance : 0,
      credit: balance < 0 ? Math.abs(balance) : 0,
    }
  } else {
    // Credit nature: positive = credit, negative = debit
    return {
      debit: balance < 0 ? Math.abs(balance) : 0,
      credit: balance >= 0 ? balance : 0,
    }
  }
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
  const tokenData = useDashboardToken()
  
  // Helper function to get last day of month from a date
  const getLastDayOfMonth = (dateString) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString + 'T00:00:00Z')
      if (isNaN(date.getTime())) return null
      // Get last day of the month
      const year = date.getUTCFullYear()
      const month = date.getUTCMonth()
      const lastDay = new Date(Date.UTC(year, month + 1, 0))
      return lastDay.toISOString().slice(0, 10) // Return YYYY-MM-DD
    } catch (e) {
      return null
    }
  }
  
  // Calculate date to use for trial balance (last pricing date or last day of reporting start date month)
  const dateToUse = useMemo(() => {
    if (lastPricingDate) {
      return lastPricingDate
    }
    // If no last pricing date, use last day of reporting start date month
    const reportingStartDate = 
      tokenData?.fund?.reporting_start_date || 
      tokenData?.reporting_start_date ||
      tokenData?.fund?.reportingStartDate ||
      tokenData?.reportingStartDate ||
      null
    
    if (reportingStartDate) {
      return getLastDayOfMonth(reportingStartDate)
    }
    return null
  }, [lastPricingDate, tokenData])

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

  // Fetch Trial Balance MTD for last pricing date or reporting start date month end
  useEffect(() => {
    if (!show || !fundId || !dateToUse) return

    const fetchTrialBalance = async () => {
      try {
        setLoading(true)
        setError('')
        const params = new URLSearchParams()
        params.set('date', dateToUse)
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
  }, [show, fundId, dateToUse])

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

        {dateToUse && (
          <div className="mb-3">
            <strong>
              {lastPricingDate ? 'Last Pricing Date:' : 'Reporting Period End Date:'}
            </strong> {dateToUse}
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
                  <th colSpan={2} className="text-center">
                    Trial Balance MTD (Last Pricing)
                  </th>
                  <th colSpan={2} className="text-center">
                    Uploaded Migration Data
                  </th>
                  <th colSpan={2} className="text-center">
                    Difference
                  </th>
                </tr>
                <tr>
                  {/* Trial Balance columns - Closing Balance as Debit/Credit */}
                  <th className="text-end">Debit</th>
                  <th className="text-end">Credit</th>
                  {/* Uploaded Data columns - Closing Balance as Debit/Credit */}
                  <th className="text-end">Debit</th>
                  <th className="text-end">Credit</th>
                  {/* Difference columns */}
                  <th className="text-end">Debit</th>
                  <th className="text-end">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                {comparisonData.length === 0 ? (
                        <tr>
                    <td colSpan={7} className="text-center text-muted">
                      No comparison data available
                          </td>
                        </tr>
                      ) : (
                  comparisonData.map((row, idx) => {
                    const trialBal = row.trialBalance
                    const uploaded = row.uploaded
                    const diff = row.difference
                    
                    // Convert closing balances to debit/credit (same as reconcile modal)
                    const trialClosing = convertToDebitCredit(trialBal?.closing || 0, row.glNumber)
                    const uploadedClosing = convertToDebitCredit(uploaded?.closing || 0, row.glNumber)
                    const diffDrCr = convertToDebitCredit(diff, row.glNumber)
                    
                    // Green if difference is 0, red if not 0
                    const diffClass = Math.abs(diff) < 0.01 ? 'text-success' : 'text-danger'

                    return (
                          <tr key={idx}>
                            <td>{row.glNumber}</td>
                            <td>{row.glName}</td>
                        {/* Trial Balance columns - show closing balance as debit/credit */}
                        <td className="text-end">{fmt(trialClosing.debit)}</td>
                        <td className="text-end">{fmt(trialClosing.credit)}</td>
                        {/* Uploaded Data columns - show closing balance as debit/credit */}
                        <td className="text-end">{fmt(uploadedClosing.debit)}</td>
                        <td className="text-end">{fmt(uploadedClosing.credit)}</td>
                        {/* Difference columns - green if 0, red if not 0 */}
                        <td className={`text-end fw-bold ${diffClass}`}>
                          {diffDrCr.debit > 0 ? fmt(diffDrCr.debit) : '—'}
                        </td>
                        <td className={`text-end fw-bold ${diffClass}`}>
                          {diffDrCr.credit > 0 ? fmt(diffDrCr.credit) : '—'}
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
        lastPricingDate={dateToUse}
      />
    </Modal>
  )
}

// Reconcile Modal Component
function ReconcileModal({ show, onClose, onPublish, trialBalanceData, uploadedData, fundId, lastPricingDate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPublishReviewModal, setShowPublishReviewModal] = useState(false)
  const [refreshedTrialBalanceData, setRefreshedTrialBalanceData] = useState([])
  
  // Helper function to fetch trial balance data
  const fetchTrialBalanceData = async (fundId, date, setData, setLoading, setError, glCodesToCheck = []) => {
    if (!fundId || !date) return []
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      params.set('date', date)
      params.set('scope', 'MTD')
      const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl-trial?${params.toString()}`
      const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const json = await resp.json()
      const allData = (json?.data || json?.rows || [])
        .map((r) => ({
          glNumber: String(r.glNumber ?? r.glnumber ?? r.gl_code ?? '').trim(),
          glName: String(r.glName ?? r.gl_name ?? '').trim(),
          opening: Number(r.opening_balance ?? r.openingbalance ?? 0),
          debit: Number(r.debit_amount ?? r.debit ?? 0),
          credit: Number(r.credit_amount ?? r.credit ?? 0),
          closing: Number(r.closing_balance ?? r.closingbalance ?? 0),
        }))
        .filter((item) => item.glNumber)
      
      console.log('[ReconcileModal] Fetched refreshed trial balance:', allData.length, 'GL codes')
      // Log a sample to verify journal entries are included
      if (glCodesToCheck && glCodesToCheck.length > 0) {
        const sampleWithJournal = allData.find(item => 
          glCodesToCheck.some(diff => diff.glNumber === item.glNumber)
        )
        if (sampleWithJournal) {
          console.log('[ReconcileModal] Sample GL with journal entry (refreshed):', {
            glNumber: sampleWithJournal.glNumber,
            glName: sampleWithJournal.glName,
            closing: sampleWithJournal.closing,
            debit: sampleWithJournal.debit,
            credit: sampleWithJournal.credit
          })
        }
      }
      
      setData(allData)
      return allData
    } catch (e) {
      console.error('[ReconcileModal] Failed to fetch trial balance:', e)
      setError('Failed to refresh trial balance data')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Calculate closing balances and differences - ALL GL CODES (no filter)
  // Use refreshed trial balance data if available (after journal creation), otherwise use original
  const reconcileData = useMemo(() => {
    const dataToUse = refreshedTrialBalanceData.length > 0 ? refreshedTrialBalanceData : trialBalanceData
    const merged = new Map()

    // Add trial balance data (from report) - ALL GL codes
    dataToUse.forEach((item) => {
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
  }, [refreshedTrialBalanceData, trialBalanceData, uploadedData])

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
    const glCodesWithDifference = reconcileData.filter(
      (item) => Math.abs(item.difference || 0) >= 0.01
    )

    if (glCodesWithDifference.length > 0) {
      setLoading(true)
      setError('')
      try {
        const token = Cookies.get('dashboardToken')
        let orgId = null
        try {
          const decoded = JSON.parse(atob(token.split('.')[1] || ''))
          orgId = decoded.org_id || decoded.orgId || null
        } catch (e) {
          console.warn('Failed to decode token for org_id:', e)
        }

        const headers = {
          ...getAuthHeaders(),
          'dashboard': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }

        const journalEntries = glCodesWithDifference.map((item) => {
          const difference = item.difference || 0
          const absDifference = Math.abs(difference)
          const isPositive = difference > 0
          const offsetAccount = '99999' // Migration adjustment offset account

          return {
            gl_code: item.glNumber,
            gl_name: item.glName,
            difference: difference,
            amount: absDifference,
            is_debit: isPositive,
            description: `Migration reconciliation adjustment for GL ${item.glNumber} - ${item.glName}`,
            dr_account: isPositive ? item.glNumber : offsetAccount,
            cr_account: isPositive ? offsetAccount : item.glNumber,
            journal_type: 'Migration', // Specific type for migration journals
          }
        })

        const migrationData = {
          fund_id: fundId,
          org_id: orgId,
          journal_date: lastPricingDate || new Date().toISOString().slice(0, 10),
          entries: journalEntries,
        }

        const url = `${apiBase}/api/v1/migration/journals`
        const resp = await fetch(url, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(migrationData),
        })

        if (!resp.ok) {
          const errorText = await resp.text().catch(() => '')
          let errorMsg = `HTTP ${resp.status}`
          try {
            const errorJson = JSON.parse(errorText)
            errorMsg = errorJson?.message || errorJson?.error || errorMsg
          } catch (_) {
            errorMsg = errorText || errorMsg
          }
          throw new Error(`Failed to create migration journal entries: ${errorMsg}`)
        }

        const result = await resp.json()
        const createdCount = result?.data?.created_count || result?.created_count || journalEntries.length
        alert(`Journals Created: ${createdCount} journal entries created successfully!`)

        // Refresh trial balance data after journals are created
        // This will update refreshedTrialBalanceData, which will trigger reconcileData recalculation
        const refreshedData = await fetchTrialBalanceData(
          fundId, 
          lastPricingDate, 
          setRefreshedTrialBalanceData, 
          setLoading, 
          setError,
          glCodesWithDifference // Pass GL codes to check in logs
        )
        
        console.log('[ReconcileModal] Refreshed trial balance data after journal creation:', refreshedData.length, 'items')
        if (refreshedData.length > 0) {
          console.log('[ReconcileModal] Sample refreshed data (first 3):', refreshedData.slice(0, 3))
        }
        
        // Wait a bit to ensure state updates are processed
        await new Promise(resolve => setTimeout(resolve, 200))

        setShowPublishReviewModal(true)
      } catch (e) {
        console.error('[ReconcileModal] Journal creation failed:', e)
        const errorMsg = e?.message || 'Unknown error'
        setError('Failed to create journal entries: ' + errorMsg)
        alert('Failed to create journal entries: ' + errorMsg)
      } finally {
        setLoading(false)
      }
    } else {
      // No differences, directly open review modal
      setShowPublishReviewModal(true)
    }
  }

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
                <th colSpan={2} className="text-center">Report Closing Balance</th>
                <th colSpan={2} className="text-center">Uploaded Closing Balance</th>
                <th colSpan={2} className="text-center">Difference</th>
                      </tr>
                      <tr>
                        <th></th>
                        <th></th>
                        <th className="text-end">Debit</th>
                        <th className="text-end">Credit</th>
                        <th className="text-end">Debit</th>
                        <th className="text-end">Credit</th>
                        <th className="text-end">Debit</th>
                        <th className="text-end">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
              {reconcileData.length === 0 ? (
                        <tr>
                  <td colSpan={8} className="text-center text-muted">
                    No data to reconcile
                          </td>
                        </tr>
                      ) : (
                <>
                  {reconcileData.map((row, idx) => {
                    const diff = row.difference || 0
                    const diffClass = Math.abs(diff) < 0.01 ? 'text-success' : 'text-danger'
                    
                    // Convert closing balances to debit/credit
                    const reportDrCr = convertToDebitCredit(row.reportClosing || 0, row.glNumber)
                    const uploadedDrCr = convertToDebitCredit(row.uploadedClosing || 0, row.glNumber)
                    const diffDrCr = convertToDebitCredit(diff, row.glNumber)
                    
                    return (
                          <tr key={idx}>
                            <td>{row.glNumber}</td>
                            <td>{row.glName}</td>
                        <td className="text-end">{fmt(reportDrCr.debit)}</td>
                        <td className="text-end">{fmt(reportDrCr.credit)}</td>
                        <td className="text-end">{fmt(uploadedDrCr.debit)}</td>
                        <td className="text-end">{fmt(uploadedDrCr.credit)}</td>
                        <td className={`text-end fw-bold ${diffClass}`}>
                          {diffDrCr.debit > 0 ? fmt(diffDrCr.debit) : '—'}
                        </td>
                        <td className={`text-end fw-bold ${diffClass}`}>
                          {diffDrCr.credit > 0 ? fmt(diffDrCr.credit) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Calculated Closing Balance Totals row */}
                  <tr className="table-primary fw-bold">
                    <td colSpan={2}>Calculated Closing Balance</td>
                    <td className="text-end">
                      {fmt(reconcileData.reduce((sum, item) => {
                        const drCr = convertToDebitCredit(item.reportClosing || 0, item.glNumber)
                        return sum + drCr.debit
                      }, 0))}
                    </td>
                    <td className="text-end">
                      {fmt(reconcileData.reduce((sum, item) => {
                        const drCr = convertToDebitCredit(item.reportClosing || 0, item.glNumber)
                        return sum + drCr.credit
                      }, 0))}
                    </td>
                    <td className="text-end">
                      {fmt(reconcileData.reduce((sum, item) => {
                        const drCr = convertToDebitCredit(item.uploadedClosing || 0, item.glNumber)
                        return sum + drCr.debit
                      }, 0))}
                    </td>
                    <td className="text-end">
                      {fmt(reconcileData.reduce((sum, item) => {
                        const drCr = convertToDebitCredit(item.uploadedClosing || 0, item.glNumber)
                        return sum + drCr.credit
                      }, 0))}
                    </td>
                    <td className={`text-end ${Math.abs(totals.differenceTotal) < 0.01 ? 'text-success' : 'text-danger'}`}>
                      {fmt(reconcileData.reduce((sum, item) => {
                        const diffDrCr = convertToDebitCredit(item.difference || 0, item.glNumber)
                        return sum + diffDrCr.debit
                      }, 0))}
                    </td>
                    <td className={`text-end ${Math.abs(totals.differenceTotal) < 0.01 ? 'text-success' : 'text-danger'}`}>
                      {fmt(reconcileData.reduce((sum, item) => {
                        const diffDrCr = convertToDebitCredit(item.difference || 0, item.glNumber)
                        return sum + diffDrCr.credit
                      }, 0))}
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
        <Button variant="primary" onClick={handlePublish} disabled={loading}>
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
            // Call onPublish callback to complete the publish process
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
        reconcileData={reconcileData}
        refreshedTrialBalanceData={refreshedTrialBalanceData}
      />
    </Modal>
  )
}

// Publish Review Modal Component
function PublishReviewModal({ show, onClose, onReview, onConfirmPublish, totals, lastPricingDate, reconcileData = [], refreshedTrialBalanceData = [] }) {
  // Check if all differences are 0 (both debit and credit)
  const canBookclose = useMemo(() => {
    if (Math.abs(totals.differenceTotal) >= 0.01) return false
    return reconcileData.every((item) => {
      const diffDrCr = convertToDebitCredit(item.difference || 0, item.glNumber)
      return Math.abs(diffDrCr.debit) < 0.01 && Math.abs(diffDrCr.credit) < 0.01
    })
  }, [totals, reconcileData])

  return (
    <Modal show={show} onHide={onClose} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Publish Review</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {lastPricingDate && (
          <div className="mb-3">
            <strong>Last Pricing Date:</strong> {lastPricingDate}
          </div>
        )}

        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <Table striped bordered hover size="sm">
            <thead className="table-light sticky-top">
              <tr>
                <th>GL Code</th>
                <th>GL Name</th>
                <th colSpan={2} className="text-center">Trial Balance</th>
                <th colSpan={2} className="text-center">Uploaded Data</th>
                <th colSpan={2} className="text-center">Difference</th>
              </tr>
              <tr>
                <th></th>
                <th></th>
                <th className="text-end">Debit</th>
                <th className="text-end">Credit</th>
                <th className="text-end">Debit</th>
                <th className="text-end">Credit</th>
                <th className="text-end">Debit</th>
                <th className="text-end">Credit</th>
              </tr>
            </thead>
            <tbody>
              {reconcileData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted">
                    No data available
                  </td>
                </tr>
              ) : (
                <>
                  {reconcileData.map((row, idx) => {
                    const diff = row.difference || 0
                    const diffClass = Math.abs(diff) < 0.01 ? 'text-success' : 'text-danger'
                    
                    // Convert closing balances to debit/credit
                    const reportDrCr = convertToDebitCredit(row.reportClosing || 0, row.glNumber)
                    const uploadedDrCr = convertToDebitCredit(row.uploadedClosing || 0, row.glNumber)
                    const diffDrCr = convertToDebitCredit(diff, row.glNumber)
                    
                    return (
                      <tr key={idx}>
                        <td>{row.glNumber}</td>
                        <td>{row.glName}</td>
                        <td className="text-end">{fmt(reportDrCr.debit)}</td>
                        <td className="text-end">{fmt(reportDrCr.credit)}</td>
                        <td className="text-end">{fmt(uploadedDrCr.debit)}</td>
                        <td className="text-end">{fmt(uploadedDrCr.credit)}</td>
                        <td className={`text-end fw-bold ${diffClass}`}>
                          {diffDrCr.debit > 0 ? fmt(diffDrCr.debit) : '—'}
                        </td>
                        <td className={`text-end fw-bold ${diffClass}`}>
                          {diffDrCr.credit > 0 ? fmt(diffDrCr.credit) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Totals row */}
                  <tr className="table-primary fw-bold">
                    <td colSpan={2}>TOTAL</td>
                    <td className="text-end">
                      {fmt(reconcileData.reduce((sum, item) => {
                        const drCr = convertToDebitCredit(item.reportClosing || 0, item.glNumber)
                        return sum + drCr.debit
                      }, 0))}
                    </td>
                    <td className="text-end">
                      {fmt(reconcileData.reduce((sum, item) => {
                        const drCr = convertToDebitCredit(item.reportClosing || 0, item.glNumber)
                        return sum + drCr.credit
                      }, 0))}
                    </td>
                    <td className="text-end">
                      {fmt(reconcileData.reduce((sum, item) => {
                        const drCr = convertToDebitCredit(item.uploadedClosing || 0, item.glNumber)
                        return sum + drCr.debit
                      }, 0))}
                    </td>
                    <td className="text-end">
                      {fmt(reconcileData.reduce((sum, item) => {
                        const drCr = convertToDebitCredit(item.uploadedClosing || 0, item.glNumber)
                        return sum + drCr.credit
                      }, 0))}
                    </td>
                    <td className={`text-end ${Math.abs(totals.differenceTotal) < 0.01 ? 'text-success' : 'text-danger'}`}>
                      {fmt(reconcileData.reduce((sum, item) => {
                        const diffDrCr = convertToDebitCredit(item.difference || 0, item.glNumber)
                        return sum + diffDrCr.debit
                      }, 0))}
                    </td>
                    <td className={`text-end ${Math.abs(totals.differenceTotal) < 0.01 ? 'text-success' : 'text-danger'}`}>
                      {fmt(reconcileData.reduce((sum, item) => {
                        const diffDrCr = convertToDebitCredit(item.difference || 0, item.glNumber)
                        return sum + diffDrCr.credit
                      }, 0))}
                    </td>
                  </tr>
                </>
              )}
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
        {/* Show Bookclose button only if both debit and credit differences are 0 */}
        {canBookclose ? (
          <Button variant="success" onClick={() => {
            // TODO: Implement bookclose functionality
            alert('Bookclose functionality will be implemented')
            onClose()
          }}>
            Bookclose
          </Button>
        ) : (
          <Button variant="primary" onClick={onConfirmPublish}>
            Confirm Publish
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

