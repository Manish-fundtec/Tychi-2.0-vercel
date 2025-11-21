'use client'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { TradeColDefs } from '@/assets/tychiData/columnDefs'
import api from '@/lib/api/axios'
import Cookies from 'js-cookie'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { formatYmd } from '../../../../../src/lib/dateFormat'
import { jwtDecode } from 'jwt-decode'
import currencies from 'currency-formatter/currencies'
import {
  Col,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Row,
  Tabs,
  Tab,
  Button,
  Alert,
  Modal,
} from 'react-bootstrap'
import { TradeModal, UploadTradeModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
import { deleteTrade } from '@/lib/api/trades'
import { buildAoaFromHeaders, exportAoaToXlsx } from '@/lib/exporters/xlsx'
import { getFundDetails } from '@/lib/api/fund'

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule])

export default function TradesData() {
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(true)
  const [fundId, setFundId] = useState('')
  const [selectedRows, setSelectedRows] = useState([])
  const [viewTrade, setViewTrade] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [fundDetails, setFundDetails] = useState(null)

  // 1) Get fundId from dashboardToken cookie (support multiple key styles)
  useEffect(() => {
    const token = Cookies.get('dashboardToken')
    if (!token) {
      // setErrMsg?.('dashboardToken cookie not found') // (optional)
      return
    }
    try {
      const payload = jwtDecode(token)
      const id = payload?.fund_id || payload?.fundId || payload?.context?.fund_id || ''
      if (!id) {
        // setErrMsg?.('fund_id not present in token') // (optional)
        return
      }
      setFundId(id)
    } catch (e) {
      console.error('[Trades] token decode error:', e)
      // setErrMsg?.('Invalid dashboard token') // (optional)
    }
  }, [])

  const dashboard = useDashboardToken()
  const fmt = dashboard?.date_format || 'MM/DD/YYYY'
  const fund_id = dashboard?.fund_id || ''
  
  // Fetch fund details to get current decimal_precision
  useEffect(() => {
    const currentFundId = fund_id || fundId
    if (!currentFundId) {
      setFundDetails(null)
      return
    }
    
    const fetchFund = async () => {
      try {
        const details = await getFundDetails(currentFundId)
        setFundDetails(details)
      } catch (error) {
        console.error('Failed to fetch fund details:', error)
        setFundDetails(null)
      }
    }
    
    fetchFund()
  }, [fund_id, fundId])
  
  // Get decimal precision - prioritize fund details from API, then token, then default to 2
  const decimalPrecision = useMemo(() => {
    // First try fund details from API (most up-to-date)
    const apiPrecision = fundDetails?.decimal_precision
    // Then try token values
    const tokenPrecision = dashboard?.decimal_precision ?? dashboard?.fund?.decimal_precision
    
    const precision = apiPrecision ?? tokenPrecision
    const numPrecision = precision !== null && precision !== undefined ? Number(precision) : null
    const result = numPrecision !== null && !isNaN(numPrecision) ? numPrecision : 2
    
    console.log('🔢 Fund details (API):', fundDetails)
    console.log('🔢 decimal_precision (API):', apiPrecision)
    console.log('🔢 decimal_precision (token):', tokenPrecision)
    console.log('🔢 Final decimalPrecision:', result)
    
    return result
  }, [fundDetails, dashboard])
  
  // Get currency symbol from reporting_currency
  const currencySymbol = useMemo(() => {
    const reportingCurrency = dashboard?.reporting_currency || dashboard?.fund?.reporting_currency || ''
    if (!reportingCurrency) return ''
    const currency = currencies.find((c) => c.code === reportingCurrency)
    return currency?.symbol || ''
  }, [dashboard])

  const refreshTrades = useCallback(async () => {
    const currentFundId = fund_id || fundId
    if (!currentFundId) return
    setLoading(true)
    const url = `/api/v1/trade/fund/${encodeURIComponent(currentFundId)}`
    try {
      const res = await api.get(url)
      const rows = Array.isArray(res?.data?.data) ? res.data.data : []
      setRowData(rows)
    } catch (e) {
      console.error('fetch trades failed', url, e?.response?.status, e?.response?.data)
      setRowData([])
    } finally {
      setLoading(false)
      setSelectedRows([])
    }
  }, [fund_id, fundId])

  useEffect(() => {
    refreshTrades()
  }, [refreshTrades])


  const columnDefs = useMemo(() => {
    return (TradeColDefs || []).map((col) => {
      if (col?.field === 'trade_date') {
        return {
          ...col,
          valueFormatter: (p) => {
            const raw = p?.value ? String(p.value).slice(0, 10) : ''
            return formatYmd(raw, fmt)
          },
        }
      }

      // Format Price column same as Amount and Gross Amount - use currency symbol at front
      if (col?.field === 'price') {
        return {
          ...col,
          valueFormatter: (p) => {
            const value = p?.value
            if (value === null || value === undefined || value === '') return '—'
            const num = Number(value)
            if (Number.isNaN(num)) return value
            const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
            return currencySymbol ? `${currencySymbol}${formatted}` : formatted
          },
        }
      }

      // Format Quantity column - use decimal precision (no currency symbol)
      if (col?.field === 'quantity') {
        return {
          ...col,
          valueFormatter: (p) => {
            const value = p?.value
            if (value === null || value === undefined || value === '') return '—'
            const num = Number(value)
            if (Number.isNaN(num)) return value
            return num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
          },
        }
      }

      // Format Amount column - use currency symbol at front
      if (col?.field === 'amount') {
        return {
          ...col,
          valueFormatter: (p) => {
            const value = p?.value
            if (typeof value === 'string' && value.trim()) {
              // If amount is already a formatted string, try to extract number and reformat with symbol
              const numMatch = value.replace(/,/g, '').match(/[\d.]+/)
              if (numMatch) {
                const num = Number(numMatch[0])
                if (!Number.isNaN(num)) {
                  const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
                  return currencySymbol ? `${currencySymbol}${formatted}` : formatted
                }
              }
              return value
            }
            if (value === null || value === undefined || value === '') return '—'
            const num = Number(value)
            if (Number.isNaN(num)) return value
            const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
            return currencySymbol ? `${currencySymbol}${formatted}` : formatted
          },
        }
      }

      if (col?.field === 'computed_amount') {
        return {
          ...col,
          valueFormatter: (p) => {
            const value = p?.value
            if (value === null || value === undefined || value === '') return '—'
            const num = Number(value)
            if (Number.isNaN(num)) return value
            const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
            return currencySymbol ? `${currencySymbol}${formatted}` : formatted
          },
        }
      }

      return col
    })
  }, [fmt, currencySymbol, decimalPrecision])

  // History state
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const fetchTradeHistory = useCallback(async () => {
    if (!fund_id) {
      setHistory([])
      return
    }
    setLoadingHistory(true)
    setHistoryError('')
    try {
      const res = await api.get(`/api/v1/trade/uploadhistory/${fund_id}`)
      const rows = res?.data?.rows || []
      const normalized = rows.map((r) => ({
        ...r,
        uploaded_at: r.uploaded_at || r.date_and_time || r.created_at || null,
      }))
      setHistory(normalized)
    } catch (e) {
      setHistoryError(e?.response?.data?.error || e?.message || 'Failed to load trade upload history')
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }, [fund_id])

  useEffect(() => {
    fetchTradeHistory()
  }, [fetchTradeHistory])

  const gridApiRef = useRef(null)

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  const updateSelectionState = useCallback(() => {
    if (!gridApiRef.current) return
    setSelectedRows(gridApiRef.current.getSelectedRows())
  }, [])

  const onSelectionChanged = useCallback(() => {
    updateSelectionState()
  }, [updateSelectionState])

  const handleSelectAll = useCallback(() => {
    if (!gridApiRef.current) return
    gridApiRef.current.selectAll()
    updateSelectionState()
  }, [updateSelectionState])

  const handleClearSelection = useCallback(() => {
    if (!gridApiRef.current) return
    gridApiRef.current.deselectAll()
    updateSelectionState()
  }, [updateSelectionState])

  const tradeExportHeaders = useMemo(
    () => [
      { key: 'trade_id', label: 'Trade ID' },
      { key: 'trade_date', label: 'Trade Date', value: (row) => (row?.trade_date ? String(row.trade_date).slice(0, 10) : '') },
      { key: 'symbol_name', label: 'Symbol' },
      { key: 'symbol_code', label: 'Symbol Code' },
      { key: 'price', label: 'Price' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'amount', label: 'Amount' },
      { key: 'computed_amount', label: 'Gross Amount' },
      { key: 'trade_type', label: 'Trade Type' },
      { key: 'broker_name', label: 'Broker' },
    ],
    [],
  )

  const formatExportValue = useCallback((key, value) => {
    if (typeof value === 'number') {
      return value.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
    }
    return value ?? ''
  }, [decimalPrecision])

  const escapeCsv = (value) => {
    const stringValue = String(value ?? '')
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  // Export filtered or selected rows (selected checkboxes take priority)
  // Also respects pagination - only exports rows visible on current page
  const handleExport = useCallback(
    (format) => {
      // Step 1️⃣ - Check if user has selected rows (checkboxes)
      // If selected rows exist, export only those
      // Otherwise, export filtered rows from current pagination page only
      let rowsToExport = []

      if (selectedRows.length > 0) {
        // User selected specific rows - export only selected
        rowsToExport = selectedRows
      } else {
        // No selection - export filtered rows from current page only
        if (gridApiRef.current) {
          // Get pagination info: current page and page size
          const currentPage = gridApiRef.current.paginationGetCurrentPage() || 0 // page number (0, 1, 2, ...)
          const pageSize = gridApiRef.current.paginationGetPageSize() || 10 // rows per page (10, 20, etc.)
          
          // Calculate start and end index for current page
          const startIndex = currentPage * pageSize // e.g., page 0 = 0, page 1 = 10, page 2 = 20
          const endIndex = startIndex + pageSize // e.g., 0+10=10, 10+10=20, 20+10=30

          // Get all filtered rows first
          const allFilteredRows = []
          gridApiRef.current.forEachNodeAfterFilterAndSort((node) => {
            if (node.data) {
              allFilteredRows.push(node.data)
            }
          })

          // Then get only the rows for current page
          // e.g., if page 1 (index 0) with page size 10: get rows 0-9
          // e.g., if page 2 (index 1) with page size 10: get rows 10-19
          rowsToExport = allFilteredRows.slice(startIndex, endIndex)
        }
        // If no filtered rows, fall back to all rows from current page
        if (rowsToExport.length === 0 && rowData.length > 0) {
          const currentPage = gridApiRef.current?.paginationGetCurrentPage() || 0
          const pageSize = gridApiRef.current?.paginationGetPageSize() || 10
          const startIndex = currentPage * pageSize
          const endIndex = startIndex + pageSize
          rowsToExport = rowData.slice(startIndex, endIndex)
        }
      }

      if (!rowsToExport.length) {
        alert('No trades to export. Please select rows or check your filters.')
        return
      }

      // Step 2️⃣ - Convert to export format using headers and formatter
      const aoa = buildAoaFromHeaders(tradeExportHeaders, rowsToExport, formatExportValue)

      // Step 3️⃣ - Export based on format
      const exportDate = new Date().toISOString().slice(0, 10)
      if (format === 'xlsx') {
        exportAoaToXlsx({
          fileName: selectedRows.length > 0 ? `trades-selected-${exportDate}` : `trades-filtered-${exportDate}`,
          sheetName: 'Trades',
          aoa,
        })
        return
      }

      // Step 4️⃣ - Create CSV file and download
      const csvContent = aoa.map((row) => row.map((cell) => escapeCsv(cell)).join(',')).join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = selectedRows.length > 0 ? `trades-selected-${exportDate}.csv` : `trades-filtered-${exportDate}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    [selectedRows, rowData, tradeExportHeaders, formatExportValue],
  )

  const confirmAndDeleteTrades = useCallback(
    async (trades) => {
      const deletable = trades.filter((t) => t?.trade_id)
      if (!deletable.length) {
        alert('No trades selected for deletion.')
        return
      }
      if (!confirm(`Delete ${deletable.length} trade(s)? This cannot be undone.`)) return
      setBulkActionLoading(true)
      try {
        for (const trade of deletable) {
          await deleteTrade(trade.trade_id)
        }
        await refreshTrades()
        gridApiRef.current?.deselectAll()
        setSelectedRows([])
      } catch (error) {
        console.error('[Trades] bulk delete failed', error)
        alert(error?.message || 'Failed to delete selected trades.')
      } finally {
        setBulkActionLoading(false)
      }
    },
    [refreshTrades],
  )

  const handleSingleDelete = useCallback(
    (trade) => {
      confirmAndDeleteTrades([trade])
    },
    [confirmAndDeleteTrades],
  )

  const handleBulkDelete = useCallback(() => {
    confirmAndDeleteTrades(selectedRows)
  }, [confirmAndDeleteTrades, selectedRows])

  const handleViewTrade = useCallback((trade) => {
    setViewTrade(trade || null)
  }, [])

  const closeViewModal = useCallback(() => setViewTrade(null), [])

  const selectedCount = selectedRows.length

  const historyColDefs = useMemo(
    () => [
      { headerName: 'File ID', field: 'file_id', width: 280 },
      { headerName: 'File Name', field: 'file_name', flex: 1 },
      {
        headerName: 'Status',
        field: 'status',
        flex: 1,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Uploaded At',
        field: 'uploaded_at',
        flex: 1,
        valueGetter: (p) => (p.data?.uploaded_at ? new Date(p.data.uploaded_at).toLocaleString() : ''),
      },
      { headerName: 'Uploaded By', field: 'user_id', flex: 1 },
    ],
    [],
  )

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Trades</CardTitle>
            <div className="d-flex gap-2">
              {/* If your modals accept onSuccess, these will refresh both tabs */}
              <TradeModal
                onSuccess={() => {
                  //  NEW: refresh after manual add
                  refreshTrades()
                  fetchTradeHistory()
                }}
              />
              <UploadTradeModal
                onSuccess={() => {
                  //  NEW: refresh after upload
                  refreshTrades()
                  fetchTradeHistory()
                }}
              />
            </div>
          </CardHeader>

          {/*  NEW: Tabs – List & Loader History */}
          <Tabs defaultActiveKey="list" id="trade-tabs" className="px-3 pt-3">
            {/* ─────────── Tab 1: Trades List ─────────── */}
            <Tab eventKey="list" title="Trades List">
              <CardBody className="p-2">
                {!fund_id && (
                  <Alert variant="warning" className="mb-3">
                    Select a fund to view trades.
                  </Alert>
                )}
                <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                  <Button variant="outline-secondary" size="sm" onClick={handleSelectAll} disabled={!rowData.length || loading}>
                    Select All
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={handleClearSelection} disabled={!selectedRows.length}>
                    Clear Selection
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={handleBulkDelete} disabled={!selectedRows.length || bulkActionLoading}>
                    {bulkActionLoading ? 'Deleting…' : `Delete Selected (${selectedCount})`}
                  </Button>
                  <Button variant="outline-success" size="sm" onClick={() => handleExport('csv')} disabled={!rowData.length || loading}>
                    {selectedRows.length > 0 ? `Export Selected CSV (${selectedRows.length})` : 'Export Filtered CSV'}
                  </Button>
                  <Button variant="outline-primary" size="sm" onClick={() => handleExport('xlsx')} disabled={!rowData.length || loading}>
                    {selectedRows.length > 0 ? `Export Selected XLSX (${selectedRows.length})` : 'Export Filtered XLSX'}
                  </Button>
                  <span className="text-muted ms-auto">
                    Selected: {selectedCount} / {rowData.length}
                  </span>
                </div>
                <div className="ag-theme-alpine" style={{ width: '100%', height: 600 }}>
                  <AgGridReact
                    onGridReady={onGridReady}
                    onSelectionChanged={onSelectionChanged}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination={true}
                    rowSelection="multiple"
                    paginationPageSize={10}
                    paginationPageSizeSelector={[10, 25, 50, 100]}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                    }}
                    context={{
                      onViewTrade: handleViewTrade,
                      onDeleteTrade: handleSingleDelete,
                    }}
                    suppressRowClickSelection={false}
                    overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading...</span>' : undefined}
                  />
                </div>
              </CardBody>
            </Tab>

            {/* ────────  NEW: Tab 2: Loader History ──────── */}
            <Tab eventKey="history" title="Loader History">
              <CardBody className="p-2">
                {!fund_id && (
                  <Alert variant="warning" className="mb-3">
                    Select a fund to view upload history.
                  </Alert>
                )}

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="m-0">Trade Uploads</h6>
                  <Button variant="outline-secondary" size="sm" onClick={fetchTradeHistory} disabled={!fund_id || loadingHistory}>
                    {loadingHistory ? 'Refreshing…' : 'Refresh'}
                  </Button>
                </div>

                {historyError && (
                  <Alert variant="danger" className="mb-2">
                    {historyError}
                  </Alert>
                )}

                {loadingHistory && (
                  <Alert variant="info" className="mb-2">
                    Loading upload history...
                  </Alert>
                )}

                {!loadingHistory && !historyError && history.length === 0 && (
                  <Alert variant="warning" className="mb-2">
                    No upload history found for this fund.
                  </Alert>
                )}

                <div style={{ width: '100%' }}>
                  <AgGridReact
                    rowData={history}
                    columnDefs={historyColDefs}
                    pagination={true}
                    paginationPageSize={10}
                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                    domLayout="autoHeight"
                  />
                </div>
              </CardBody>
            </Tab>
          </Tabs>
          {/*  NEW: /Tabs */}
        </Card>
      </Col>
      <Modal show={!!viewTrade} onHide={closeViewModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Trade Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!viewTrade && <p className="mb-0 text-muted">No trade selected.</p>}
          {viewTrade && (
            <div className="table-responsive">
              <table className="table table-sm table-striped align-middle">
                <tbody>
                  {Object.entries(viewTrade).map(([key, value]) => (
                    <tr key={key}>
                      <th style={{ width: 200 }} className="text-uppercase text-muted small">
                        {key}
                      </th>
                      <td>{value === null || value === undefined || value === '' ? '—' : String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeViewModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Row>
  )
}

// Latest comment on 10/29/2025
// 'use client'
// import { useEffect, useState, useCallback, useMemo } from 'react'
// import { AgGridReact } from 'ag-grid-react'
// import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
// import { TradeColDefs } from '@/assets/tychiData/columnDefs'
// import api from '@/lib/api/axios'
// import Cookies from 'js-cookie'
// import { useDashboardToken } from '@/hooks/useDashboardToken'
// import { formatYmd } from '../../../../../src/lib/dateFormat'
// import { jwtDecode } from 'jwt-decode'
// import { Col, Card, CardBody, CardHeader, CardTitle, Row } from 'react-bootstrap'
// import { TradeModal, UploadTradeModal } from '@/app/(admin)/base-ui/modals/components/AllModals'

// // Register all Community features
// ModuleRegistry.registerModules([AllCommunityModule])
// export default function TradesData() {
//   const [rowData, setRowData] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [fundId, setFundId] = useState('')
//   // 1) Get fundId from dashboardToken cookie (support multiple key styles)
//   useEffect(() => {
//     const token = Cookies.get('dashboardToken')
//     if (!token) {
//       setErrMsg('dashboardToken cookie not found')
//       return
//     }
//     try {
//       const payload = jwtDecode(token)
//       console.log('[Journals] decoded token payload:', payload)
//       const id = payload?.fund_id || payload?.fundId || payload?.context?.fund_id || ''
//       if (!id) {
//         setErrMsg('fund_id not present in token')
//         return
//       }
//       setFundId(id)
//     } catch (e) {
//       console.error('[Journals] token decode error:', e)
//       setErrMsg('Invalid dashboard token')
//     }
//   }, [])

//   const refreshTrades = useCallback(async () => {
//     if (!fundId) return // ✅ guard: don’t call with blank id

//     // If your axios baseURL already includes /api/v1, use `/trades/fund/...`
//     // Otherwise keep `/api/v1/trade(s)/fund/...` as needed.
//     const url = `/api/v1/trade/fund/${encodeURIComponent(fundId)}` // or /trade/ if that’s your server
//     try {
//       const res = await api.get(url)
//       const rows = Array.isArray(res?.data?.data) ? res.data.data : []
//       setRowData(rows)
//     } catch (e) {
//       console.error('fetch trades failed', url, e?.response?.status, e?.response?.data)
//       setRowData([])
//     }
//   }, [fundId])

//   useEffect(() => {
//     if (!fundId) return
//     refreshTrades()
//   }, [fundId, refreshTrades])

//   const defaultColDef = { resizable: true, sortable: true, filter: true }
//   // useEffect(() => {
//   //   ;(async () => {
//   //     try {
//   //       const data = await getAllTrades()
//   //       setRowData(data)
//   //     } catch (e) {
//   //       console.error('Failed to fetch trades', e)
//   //     } finally {
//   //       setLoading(false)
//   //     }
//   //   })()
//   // }, [])

//   const dashboard = useDashboardToken()
//   const fmt = dashboard?.date_format || 'MM/DD/YYYY'
//   // Optional UX: show a lightweight state until token is ready
//   // define columnDefs here (NOT inside JSX)
//   const columnDefs = useMemo(() => {
//     return (TradeColDefs || []).map((col) => {
//       if (col?.field !== 'trade_date') return col
//       return {
//         ...col,
//         valueFormatter: (p) => {
//           const raw = p?.value ? String(p.value).slice(0, 10) : ''
//           return formatYmd(raw, fmt) // 'MM/DD/YYYY' or 'DD/MM/YYYY'
//         },
//       }
//     })
//   }, [fmt])

//   return (
//     <Row>
//       <Col xl={12}>
//         <Card>
//           <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
//             <CardTitle as="h4">Trades</CardTitle>
//             <div className="d-flex gap-2">
//               <TradeModal />
//               <UploadTradeModal />
//             </div>
//           </CardHeader>
//           <CardBody className="p-2">
//             <div style={{ height: '100%', width: '100%' }}>
//               <AgGridReact
//                 rowData={rowData}
//                 columnDefs={columnDefs}
//                 pagination={true}
//                 rowSelection="multiple"
//                 paginationPageSize={10}
//                 defaultColDef={{
//                   sortable: true,
//                   filter: true,
//                   resizable: true,
//                 }}
//                 domLayout="autoHeight"
//                 overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading...</span>' : undefined}
//               />
//             </div>
//           </CardBody>
//         </Card>
//       </Col>
//     </Row>
//   )
// }

// -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Previous comment
// 'use client'

// import IconifyIcon from '@/components/wrappers/IconifyIcon'
// import { getAllTrades } from '@/helpers/data'
// import { useFetchData } from '@/hooks/useFetchData'
// import useToggle from '@/hooks/useToggle'
// import Link from 'next/link'
// import { TradeModal, UploadTradeModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
// import { useEffect, useState } from 'react'
// import { AgGridReact } from 'ag-grid-react' // React Data Grid Component
// import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
// import { TradeColDefs } from '@/assets/tychiData/columnDefs'

// // Register all Community features
// ModuleRegistry.registerModules([AllCommunityModule])
// import {
//   Col,
//   Button,
//   Card,
//   CardBody,
//   CardFooter,
//   CardHeader,
//   CardTitle,
//   Dropdown,
//   DropdownItem,
//   DropdownMenu,
//   DropdownToggle,
//   Row,
//   Modal
// } from 'react-bootstrap'
// const TradesData = () => {
//   const tradesData = useFetchData(getAllTrades)
//   const { isTrue, toggle } = useToggle()

//   return (
//     <>
//       {/* <TradeModal /> */}
//       <Row>
//         <Col xl={12}>
//           <Card>
//             <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
//               <div>
//                 <CardTitle as={'h4'}>All Transactions List</CardTitle>
//               </div>

//               <div className="d-flex gap-2">
//                 <TradeModal />
//                 <UploadTradeModal />
//               </div>
//             </CardHeader>
//             <CardBody className="p-2">
//               <div
//                 // define a height because the Data Grid will fill the size of the parent container
//                 style={{
//                   height: '100%', // Take the full height of the parent container
//                   width: '100%', // Take the full width of the parent container
//                 }}>
//                 <AgGridReact
//                   rowData={tradesData}
//                   columnDefs={TradeColDefs}
//                   pagination={true} // Enable pagination
//                   paginationPageSize={10} // Set page size
//                   defaultColDef={{
//                     sortable: true,
//                     filter: true,
//                     resizable: true, // Allow resizing
//                   }}
//                   domLayout="autoHeight" // Automatically adjust height
//                 />
//               </div>
//             </CardBody>
//           </Card>
//         </Col>
//       </Row>

//     </>
//   )
// }
// export default TradesData
