'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { TradeColDefs } from '@/assets/tychiData/columnDefs'
import api from '@/lib/api/axios'
import Cookies from 'js-cookie'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { formatYmd } from '../../../../../src/lib/dateFormat'
import { jwtDecode } from 'jwt-decode'
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
  Alert, //  NEW: Tabs, Tab, Button, Alert
} from 'react-bootstrap'
import { TradeModal, UploadTradeModal } from '@/app/(admin)/base-ui/modals/components/AllModals'

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule])

export default function TradesData() {
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(true)
  const [fundId, setFundId] = useState('')
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')

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
    }
  }, [fund_id, fundId])

  useEffect(() => {
    refreshTrades()
  }, [refreshTrades])

  // 3) fetch upload history
  // const fetchTradeHistory = useCallback(async () => {
  //   if (!fundId) {
  //     setHistory([])
  //     return
  //   }

  //   try {
  //     setLoadingHistory(true)
  //     setHistoryError('')
  //     // 👇 this is the route we just created in backend
  //     const { data } = await api.get('/api/v1/trade/uploads/history', {
  //       params: { fund_id: fundId },
  //     })

  //     // backend returns { success, data, count }
  //     const rows = Array.isArray(data?.data) ? data.data : []
  //     setHistory(rows)
  //   } catch (err) {
  //     console.error('[Trades] fetch trade upload history failed:', err)
  //     setHistoryError(err?.response?.data?.message || 'Failed to load upload history')
  //     setHistory([])
  //   } finally {
  //     setLoadingHistory(false)
  //   }
  // }, [fundId])

  // useEffect(() => {
  //   if (!fundId) return
  //   refreshTrades()
  //   // fetchTradeHistory() //  NEW: also load history when fund changes
  // }, [fundId, refreshTrades, fetchTradeHistory])

  const columnDefs = useMemo(() => {
    return (TradeColDefs || []).map((col) => {
      if (col?.field !== 'trade_date') return col
      return {
        ...col,
        valueFormatter: (p) => {
          const raw = p?.value ? String(p.value).slice(0, 10) : ''
          return formatYmd(raw, fmt)
        },
      }
    })
  }, [fmt])

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
                <div style={{ width: '100%' }}>
                  <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination={true}
                    rowSelection="multiple"
                    paginationPageSize={10}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                    }}
                    domLayout="autoHeight"
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
