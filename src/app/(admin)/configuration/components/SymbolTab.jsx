// 'use client'

// import { AgGridReact } from 'ag-grid-react'
// import { useSymbolData } from '@/hooks/useSymbolData'
// import { useDashboardToken } from '@/hooks/useDashboardToken'
// import { UploadSymbolModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
// import {SymbolModal} from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
// import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Button, Row, Alert } from 'react-bootstrap'
// import { symbolColDefs } from '@/assets/tychiData/columnDefs'

// const SymbolTab = () => {
//   const { fund_id } = useDashboardToken() || {}
//   const { symbols, refetchSymbols, editingSymbol, setEditingSymbol, showModal, setShowModal, handleEdit, handleDelete } = useSymbolData(fund_id)

//   return (
//     <Row>
//       <Col xl={12}>
//         <Card>
//           <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
//             <CardTitle as="h4">Symbol List</CardTitle>
//             <Dropdown>
//               <SymbolModal
//                 show={showModal}
//                 onClose={() => {
//                   setEditingSymbol(null)
//                   setShowModal(false)
//                 }}
//                 symbol={editingSymbol}
//                 fundId={fund_id}
//                 onSuccess={refetchSymbols}
//               />

//               <div className="d-flex gap-2">
//                 <Button onClick={() => setShowModal(true)} disabled={!fund_id}>
//                   Add
//                 </Button>
//                 <UploadSymbolModal
//                   buttonLabel="Upload"
//                   modalTitle="Upload Symbol"
//                   fundId={fund_id}
//                   onSuccess={refetchSymbols}
//                 />
//               </div>
//             </Dropdown>
//           </CardHeader>
//           <CardBody className="p-2">
//             {!fund_id && (
//               <Alert variant="warning" className="mb-3">
//                 No fund selected. Showing all symbols. Select a fund to filter this list.
//               </Alert>
//             )}
//             <div style={{ height: '100%', width: '100%' }}>
//               <AgGridReact
//                 rowData={symbols}
//                 columnDefs={symbolColDefs}
//                 pagination={true}
//                 paginationPageSize={10}
//                 defaultColDef={{ sortable: true, filter: true, resizable: true }}
//                 domLayout="autoHeight"
//                 context={{ handleEdit, handleDelete }} // ✅ Pass context here
//               />
//             </div>
//           </CardBody>
//         </Card>
//       </Col>
//     </Row>
//   )
// }

// export default SymbolTab

'use client'

import { AgGridReact } from 'ag-grid-react'
import { useEffect, useMemo, useState } from 'react' //NEW: useEffect/useState
import { useSymbolData } from '@/hooks/useSymbolData'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { UploadSymbolModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
import { SymbolModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  Dropdown,
  Button,
  Row,
  Alert,
  Tabs,
  Tab, // NEW: Tabs/Tab
} from 'react-bootstrap'
import { symbolColDefs } from '@/assets/tychiData/columnDefs'
import api from '@/lib/api/axios' // NEW: for history fetch

const SymbolTab = () => {
  const { fund_id } = useDashboardToken() || {}
  const { symbols, refetchSymbols, editingSymbol, setEditingSymbol, showModal, setShowModal, handleEdit, handleDelete } = useSymbolData(fund_id)

  // NEW: local state for “Symbol Loader History”
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  // NEW: grid columns for history
  const historyColDefs = useMemo(
    () => [
      {
        headerName: 'Uploaded At',
        field: 'uploaded_at',
        sortable: true,
        filter: true,
        valueGetter: (p) => (p.data?.uploaded_at ? new Date(p.data.uploaded_at).toLocaleString() : ''),
      },
      { headerName: 'File Name', field: 'file_name', sortable: true, filter: true , flex:1},
      { headerName: 'Status', field: 'status', sortable: true, filter: true , flex:1}, // e.g. SUCCESS / FAILED / PARTIAL
      { headerName: 'Total Rows', field: 'total_rows', sortable: true, filter: true , flex:1},
      { headerName: 'Processed', field: 'processed_rows', sortable: true, filter: true , flex:1},
      { headerName: 'Uploaded By', field: 'uploaded_by', sortable: true, filter: true , flex:1}, // optional
    ],
    [],
  )

  // NEW: fetch history (adjust endpoint if yours differs)
  const fetchHistory = async () => {
    if (!fund_id) {
      setHistory([])
      return
    }
    try {
      setLoadingHistory(true)
      setHistoryError('')
      // Suggested endpoint: /api/v1/symbols/uploads/history?fund_id=...
      const { data } = await api.get('/api/v1/symbols/uploads/history', { params: { fund_id } })
      // Expect data to be an array of history rows:
      // [{ uploaded_at, file_name, status, total_rows, processed_rows, created, updated, errors_count, uploaded_by }]
      setHistory(Array.isArray(data) ? data : data?.data || [])
    } catch (err) {
      setHistoryError(err?.response?.data?.message || 'Failed to load upload history')
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  // NEW: load history when fund_id changes
  useEffect(() => {
    fetchHistory()
  }, [fund_id])

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Symbols</CardTitle>
            <Dropdown>
              <SymbolModal
                show={showModal}
                onClose={() => {
                  setEditingSymbol(null)
                  setShowModal(false)
                }}
                symbol={editingSymbol}
                fundId={fund_id}
                onSuccess={() => {
                  refetchSymbols()
                  fetchHistory() // 🔵 NEW: refresh history after any add/edit
                }}
              />

              <div className="d-flex gap-2">
                <Button onClick={() => setShowModal(true)} disabled={!fund_id}>
                  Add
                </Button>
                <UploadSymbolModal
                  buttonLabel="Upload"
                  modalTitle="Upload Symbol"
                  fundId={fund_id}
                  onSuccess={() => {
                    refetchSymbols()
                    fetchHistory() // 🔵 NEW: refresh history after upload
                  }}
                />
              </div>
            </Dropdown>
          </CardHeader>

          {/* 🔵 NEW: Tabs wrapper */}
          <Tabs defaultActiveKey="list" id="symbol-tabs" className="px-3 pt-3">
            {/* ───────────────────────── Tab 1: Symbol List ───────────────────────── */}
            <Tab eventKey="list" title="Symbol List">
              <CardBody className="p-2">
                {!fund_id && (
                  <Alert variant="warning" className="mb-3">
                    No fund selected. Showing all symbols. Select a fund to filter this list.
                  </Alert>
                )}
                <div style={{ height: '100%', width: '100%' }}>
                  <AgGridReact
                    rowData={symbols}
                    columnDefs={symbolColDefs}
                    pagination={true}
                    paginationPageSize={10}
                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                    domLayout="autoHeight"
                    context={{ handleEdit, handleDelete }}
                  />
                </div>
              </CardBody>
            </Tab>

            {/* ──────────────────── 🔵 NEW: Tab 2: Symbol Loader History ─────────────── */}
            <Tab eventKey="history" title="Symbol Loader History">
              <CardBody className="p-2">
                {!fund_id && (
                  <Alert variant="warning" className="mb-3">
                    Select a fund to view upload history.
                  </Alert>
                )}

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="m-0">Upload History</h6>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={fetchHistory} disabled={!fund_id || loadingHistory}>
                      {loadingHistory ? 'Refreshing…' : 'Refresh'}
                    </Button>
                  </div>
                </div>

                {historyError && (
                  <Alert variant="danger" className="mb-2">
                    {historyError}
                  </Alert>
                )}

                <div style={{ height: '100%', width: '100%' }}>
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
          {/* 🔵 NEW: /Tabs */}
        </Card>
      </Col>
    </Row>
  )
}

export default SymbolTab
