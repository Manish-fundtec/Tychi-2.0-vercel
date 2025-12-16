'use client'

import { AgGridReact } from 'ag-grid-react'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
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
import Cookies from 'js-cookie'
import { bulkDeleteSymbols } from '@/lib/api/symbol'

const normalizeStatusText = (value) => String(value || '')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/gi, ' ')
  .trim()
  .toLowerCase()

const SymbolTab = () => {
  const { fund_id } = useDashboardToken() || {}
  const { symbols, refetchSymbols, editingSymbol, setEditingSymbol, showModal, setShowModal, handleEdit, handleDelete } = useSymbolData(fund_id)

  // NEW: local state for "Symbol Loader History"
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [announceValidation, setAnnounceValidation] = useState(false)

  // Selection state for bulk delete
  const [selectedRows, setSelectedRows] = useState([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const gridApiRef = useRef(null)

  // NEW: grid columns for history
  // ── Columns for history grid
  const historyColDefs = useMemo(
    () => [
      { headerName: 'File ID', field: 'file_id', sortable: true, filter: true, width: 280 },
      { headerName: 'File Name', field: 'file_name', sortable: true, filter: true, flex: 1 },
      {
        headerName: 'Status',
        field: 'plain_status',
        sortable: true,
        filter: true,
        flex: 1,
        valueFormatter: (params) => {
          const raw = params?.data?.plain_status || ''
          if (!raw) return params?.value || ''
          return raw.replace(/\b\w/g, (c) => c.toUpperCase())
        },
        cellClassRules: {
          'text-success fw-semibold': (p) => p?.data?.plain_status === 'completed',
          'text-danger fw-semibold': (p) => p?.data?.plain_status === 'validation failed',
        },
      },
      {
        headerName: 'Uploaded At',
        field: 'uploaded_at',
        sortable: true,
        filter: true,
        flex: 1,
        valueGetter: (p) => (p.data?.uploaded_at ? new Date(p.data.uploaded_at).toLocaleString() : ''),
      },
      { headerName: 'Uploaded By', field: 'user_id', sortable: true, filter: true, flex: 1 },
    ],
    [],
  )
  // ── Fetch history (simple)
  const fetchHistory = useCallback(async ({ announce = false } = {}) => {
    if (!fund_id) return
    setLoadingHistory(true)
    setHistoryError('')
    try {
      const token = Cookies.get('dashboardToken')
      const res = await api.get(
        // adjust base prefix only if your backend mount path differs
        `/api/v1/symbols/uploadhistory/${fund_id}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      )
      const payload = res?.data ?? []
      let rows = []
      if (Array.isArray(payload)) rows = payload
      else if (Array.isArray(payload?.rows)) rows = payload.rows
      else if (Array.isArray(payload?.data)) rows = payload.data
      else if (Array.isArray(payload?.data?.rows)) rows = payload.data.rows
      // normalize uploaded_at if your API returns created_at instead
      const normalized = rows
        .map((r) => ({
          ...r,
          uploaded_at: r.date_and_time || r.uploaded_at || r.created_at || null,
          plain_status: normalizeStatusText(r.status),
        }))
        .sort((a, b) => {
          const aTime = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0
          const bTime = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0
          return bTime - aTime
        })
      setHistory(normalized)

      const topLevelFailed = typeof payload === 'object' && payload !== null && payload.status === 'Validation Failed'
      const shouldAlert = announce || announceValidation
      const latestRowFailed = normalized.length
        ? normalizeStatusText(normalized[0].status) === 'validation failed'
        : false

      if (shouldAlert && (topLevelFailed || latestRowFailed)) {
        alert('Symbol upload validation failed. Check loader history for details.')
      }
    } catch (err) {
      setHistoryError(err?.response?.data?.error || err?.message || 'Failed to load upload history')
    } finally {
      setLoadingHistory(false)
      if (announce || announceValidation) setAnnounceValidation(false)
    }
  }, [fund_id, announceValidation])

  // Fetch on fund change
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Grid selection handlers
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

  // Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    if (!selectedRows.length) {
      alert('No symbols selected for deletion.')
      return
    }

    if (!confirm(`Delete ${selectedRows.length} symbol(s)? This cannot be undone.`)) {
      return
    }

    setBulkActionLoading(true)
    try {
      const symbolIds = selectedRows.map((row) => row.symbol_uid).filter(Boolean)
      if (!symbolIds.length) {
        alert('No valid symbols to delete.')
        return
      }

      const response = await bulkDeleteSymbols(symbolIds)
      const responseData = response?.data || {}
      
      await refetchSymbols()
      gridApiRef.current?.deselectAll()
      setSelectedRows([])
      
      // Build success message with skipped symbols info
      let message = responseData.message || 'Symbols deleted successfully.'
      
      if (responseData.skipped && responseData.skipped.length > 0) {
        const skippedCount = responseData.skipped.length
        const deletedCount = responseData.deleted?.length || 0
        
        // Get skipped symbol names for display
        const skippedNames = selectedRows
          .filter((row) => responseData.skipped.includes(row.symbol_uid))
          .map((row) => row.symbol_name || row.symbol_uid)
          .join(', ')
        
        message = `${deletedCount > 0 ? `${deletedCount} symbol(s) deleted successfully.` : ''}\n\n${skippedCount} symbol(s) skipped: ${skippedNames}\n\nReason: ${responseData.skipped_reason || 'Symbols are used in trades or lots and cannot be deleted.'}`
      } else if (responseData.deleted) {
        const deletedCount = responseData.deleted.length
        message = `${deletedCount} symbol(s) deleted successfully.`
      }
      
      alert(message)
    } catch (error) {
      console.error('[Symbols] bulk delete failed', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete selected symbols.'
      
      // Check if response includes skipped symbols info even in error
      if (error?.response?.data?.skipped && error.response.data.skipped.length > 0) {
        const skippedCount = error.response.data.skipped.length
        const skippedNames = selectedRows
          .filter((row) => error.response.data.skipped.includes(row.symbol_uid))
          .map((row) => row.symbol_name || row.symbol_uid)
          .join(', ')
        
        alert(`${errorMessage}\n\n${skippedCount} symbol(s) were skipped: ${skippedNames}`)
      } else {
        alert(errorMessage)
      }
    } finally {
      setBulkActionLoading(false)
    }
  }, [selectedRows, refetchSymbols])

  const selectedCount = selectedRows.length

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
                  setAnnounceValidation(false)
                  fetchHistory()
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
                    setAnnounceValidation(true)
                    fetchHistory({ announce: true })
                  }}
                />
              </div>
            </Dropdown>
          </CardHeader>

          {/*  NEW: Tabs wrapper */}
          <Tabs
            defaultActiveKey="list"
            id="symbol-tabs"
            className="px-3 pt-3"
            onSelect={(k) => {
              if (k === 'history') fetchHistory()
            }}>
            {/* ───────────────────────── Tab 1: Symbol List ───────────────────────── */}
            <Tab eventKey="list" title="Symbol List">
              <CardBody className="p-2">
                {!fund_id && (
                  <Alert variant="warning" className="mb-3">
                    No fund selected. Showing all symbols. Select a fund to filter this list.
                  </Alert>
                )}
                <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                  <Button variant="outline-secondary" size="sm" onClick={handleSelectAll} disabled={!symbols.length}>
                    Select All
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={handleClearSelection} disabled={!selectedRows.length}>
                    Clear Selection
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={handleBulkDelete} disabled={!selectedRows.length || bulkActionLoading}>
                    {bulkActionLoading ? 'Deleting…' : `Delete Selected (${selectedCount})`}
                  </Button>
                  <span className="text-muted ms-auto">
                    Selected: {selectedCount} / {symbols.length}
                  </span>
                </div>
                <div style={{ height: '100%', width: '100%' }}>
                  <AgGridReact
                    onGridReady={onGridReady}
                    onSelectionChanged={onSelectionChanged}
                    rowData={symbols}
                    columnDefs={symbolColDefs}
                    pagination={true}
                    paginationPageSize={10}
                    rowSelection="multiple"
                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                    domLayout="autoHeight"
                    context={{ handleEdit, handleDelete }}
                    suppressRowClickSelection={false}
                  />
                </div>
              </CardBody>
            </Tab>

            {/* ────────────────────  NEW: Tab 2: Symbol Loader History ─────────────── */}
            <Tab eventKey="history" title="Symbol Loader History">
              <CardBody className="p-2">
                {!fund_id && (
                  <Alert variant="warning" className="mb-3">
                    Select a fund to view upload history.
                  </Alert>
                )}

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="m-0">Upload History</h6>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => fetchHistory()}
                    disabled={!fund_id || loadingHistory}>
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
                    rowClassRules={{
                      'bg-success-subtle': (p) => p?.data?.plain_status === 'completed',
                      'bg-danger-subtle text-black': (p) => p?.data?.plain_status === 'validation failed',
                    }}
                    pagination
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

export default SymbolTab

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
