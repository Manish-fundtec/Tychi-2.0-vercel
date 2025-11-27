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
          .filter((item) => item.glNumber) // Filter out empty GL codes

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
        const url = `${apiBase}/api/v1/migration/trialbalance/${encodeURIComponent(fundId)}`
        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' })
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
          .filter((item) => item.glNumber) // Filter out empty GL codes

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

  // Create merged comparison data
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

    return Array.from(merged.values()).sort((a, b) => a.glNumber.localeCompare(b.glNumber))
  }, [trialBalanceData, uploadedData])

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
          <Row>
            {/* Left Side - Trial Balance MTD */}
            <Col md={6}>
              <div className="mb-3">
                <h5 className="text-primary">Trial Balance MTD (Last Pricing)</h5>
                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <Table striped bordered hover size="sm">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>GL Code</th>
                        <th>GL Name</th>
                        <th className="text-end">Opening</th>
                        <th className="text-end">Debit</th>
                        <th className="text-end">Credit</th>
                        <th className="text-end">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trialBalanceData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No trial balance data available
                          </td>
                        </tr>
                      ) : (
                        trialBalanceData.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.glNumber}</td>
                            <td>{row.glName}</td>
                            <td className="text-end">{fmt(row.opening)}</td>
                            <td className="text-end">{fmt(row.debit)}</td>
                            <td className="text-end">{fmt(row.credit)}</td>
                            <td className="text-end">{fmt(row.closing)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Col>

            {/* Right Side - Uploaded Data */}
            <Col md={6}>
              <div className="mb-3">
                <h5 className="text-success">Uploaded Migration Data</h5>
                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <Table striped bordered hover size="sm">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>GL Code</th>
                        <th>GL Name</th>
                        <th className="text-end">Opening</th>
                        <th className="text-end">Debit</th>
                        <th className="text-end">Credit</th>
                        <th className="text-end">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No uploaded data available
                          </td>
                        </tr>
                      ) : (
                        uploadedData.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.glNumber}</td>
                            <td>{row.glName}</td>
                            <td className="text-end">{fmt(row.opening)}</td>
                            <td className="text-end">{fmt(row.debit)}</td>
                            <td className="text-end">{fmt(row.credit)}</td>
                            <td className="text-end">{fmt(row.closing)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={() => {}}>
          Reconcile
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

