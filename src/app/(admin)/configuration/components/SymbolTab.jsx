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
  Spinner,
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
  const { 
    loading, 
    totalRecords,
    createDatasource, 
    refreshGrid,
    refetchSymbols, 
    editingSymbol, 
    setEditingSymbol, 
    showModal, 
    setShowModal, 
    handleEdit, 
    handleDelete,
    gridApiRef: hookGridApiRef
  } = useSymbolData(fund_id)

  // NEW: local state for "Symbol Loader History"
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [announceValidation, setAnnounceValidation] = useState(false)

  // Selection state for bulk delete
  const [selectedRows, setSelectedRows] = useState([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [initialLoading, setInitialLoading] = useState(true) // Initial loading state
  const gridApiRef = useRef(null)
  const fetchingHistoryRef = useRef(false) // Prevent duplicate history fetches
  const lastFundIdRef = useRef(null) // Track fund_id to reset fetch state

  // Download error file handler
  const handleDownloadErrorFile = useCallback(async (fileId) => {
    if (!fund_id || !fileId) {
      alert('Missing fund ID or file ID')
      return
    }

    try {
      // Let axios interceptor handle authentication automatically
      const response = await api.get(
        `/api/v1/symbols/uploadhistory/${fund_id}/errorfile/${fileId}`,
        {
          responseType: 'blob',
        }
      )

      // Create blob from response
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      })

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition']
      let filename = `error-file-${fileId}.xlsx`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // Trigger browser download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert(error?.response?.data?.message || error?.message || 'Failed to download error file')
    }
  }, [fund_id])

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
      {
        headerName: 'Uploaded By',
        field: 'user_name',
        sortable: true,
        filter: true,
        flex: 1,
        valueGetter: (p) => {
          const userName = p.data?.user_name
          const userId = p.data?.user_id
          return userName || userId || 'Unknown User'
        },
      },
      {
        headerName: 'Download error file',
        field: 'download',
        width: 160,
        sortable: false,
        filter: false,
        cellRenderer: (params) => {
          // error_file_url can be a boolean flag (true) or a URL string
          // Show button when error_file_url exists (truthy) and file_id is present
          const errorFileUrl = params.data?.error_file_url
          const fileId = params.data?.file_id

          // Show download button if error_file_url exists (boolean true or non-empty string) and file_id is present
          if (!errorFileUrl || !fileId) {
            return ''
          }

          return (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadErrorFile(fileId)
              }}
            >
              Download
            </Button>
          )
        },
      },
    ],
    [handleDownloadErrorFile],
  )
  // ── Fetch history (simple)
  const fetchHistory = useCallback(async ({ announce = false } = {}) => {
    if (!fund_id) {
      setHistory([])
      fetchingHistoryRef.current = false
      lastFundIdRef.current = null
      return
    }
    
    // Prevent duplicate calls in the same render cycle
    if (fetchingHistoryRef.current && lastFundIdRef.current === fund_id) {
      return
    }
    
    fetchingHistoryRef.current = true
    lastFundIdRef.current = fund_id
    setLoadingHistory(true)
    setHistoryError('')
    try {
      const res = await api.get(`/api/v1/symbols/uploadhistory/${fund_id}`)
      console.log('[Symbols History] API Response:', res?.data)
      
      // Match trades pattern exactly
      const rows = res?.data?.rows || []
      console.log('[Symbols History] Parsed rows:', rows.length, rows)
      
      // Normalize data - handle flat structure (no nested User object)
      // Backward compatibility: support both date_and_time and uploaded_at
      const normalized = rows.map((r) => {
        // Handle flat structure - extract fields directly (no nested User object)
        // uploaded_at: prioritize uploaded_at, fallback to date_and_time for backward compatibility
        const uploadedAt = r.uploaded_at || r.date_and_time || r.created_at || null
        
        // user_name: already in flat structure, no need to extract from nested User
        // error_file_url: already in flat structure
        // file_id: already in flat structure
        
        return {
          ...r,
          uploaded_at: uploadedAt,
          plain_status: normalizeStatusText(r.status),
          // Ensure all required fields are present
          file_id: r.file_id || r.id || '',
          file_name: r.file_name || r.filename || '',
          user_name: r.user_name || r.userName || null, // Flat structure - user_name is directly on the object
          user_id: r.user_id || r.userId || null, // Keep user_id as fallback
          error_file_url: r.error_file_url || r.errorFileUrl || null, // For download button
        }
      })
      
      console.log('[Symbols History] Normalized data:', normalized)
      setHistory(normalized)

      const topLevelFailed = typeof res?.data === 'object' && res?.data !== null && res?.data.status === 'Validation Failed'
      const shouldAlert = announce || announceValidation
      const latestRowFailed = normalized.length
        ? normalizeStatusText(normalized[0].status) === 'validation failed'
        : false

      if (shouldAlert && (topLevelFailed || latestRowFailed)) {
        alert('Symbol upload validation failed. Check loader history for details.')
      }
    } catch (err) {
      console.error('[Symbols History] Fetch error:', err)
      console.error('[Symbols History] Error response:', err?.response?.data)
      setHistoryError(err?.response?.data?.error || err?.message || 'Failed to load symbol upload history')
      setHistory([])
    } finally {
      setLoadingHistory(false)
      fetchingHistoryRef.current = false
      if (announce || announceValidation) setAnnounceValidation(false)
    }
  }, [fund_id, announceValidation])

  // Sync initialLoading with loading state from hook
  useEffect(() => {
    if (!loading && initialLoading) {
      // When loading finishes, turn off initialLoading after a small delay
      const timer = setTimeout(() => {
        setInitialLoading(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [loading, initialLoading])

  // Reset grid datasource when fundId or pageSize changes
  useEffect(() => {
    if (gridApiRef.current && fund_id) {
      setInitialLoading(true) // Show loading when fund_id changes
      const datasource = createDatasource(pageSize)
      gridApiRef.current.setGridOption('datasource', datasource)
      gridApiRef.current.paginationGoToPage(0) // Reset to first page
    } else if (!fund_id) {
      setInitialLoading(false)
    }
  }, [fund_id, pageSize, createDatasource])

  // Fetch on fund change - only when fund_id exists
  useEffect(() => {
    if (!fund_id) {
      setHistory([])
      fetchingHistoryRef.current = false
      lastFundIdRef.current = null
      return
    }
    
    // Prevent duplicate calls - only fetch if fund_id changed or hasn't been fetched yet
    if (lastFundIdRef.current === fund_id && fetchingHistoryRef.current) {
      // Already fetching or fetched for this fund_id, skip
      return
    }
    
    // Reset fetch state if fund_id changed
    if (lastFundIdRef.current !== fund_id) {
      fetchingHistoryRef.current = false
    }
    
    // Mark that we're about to fetch for this fund_id
    lastFundIdRef.current = fund_id
    
    // Call fetchHistory
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fund_id]) // Only depend on fund_id, not fetchHistory to avoid infinite loops

  // Grid selection handlers
  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
    hookGridApiRef.current = params.api
    
    // Set up infinite row model datasource
    const datasource = createDatasource(pageSize)
    params.api.setGridOption('datasource', datasource)
    
    // Reset initial loading after grid is ready
    setInitialLoading(false)
  }, [createDatasource, pageSize, hookGridApiRef])

  // Handle pagination changes (page or page size)
  const onPaginationChanged = useCallback((params) => {
    if (!params.api) return
    
    const newPageSize = params.api.paginationGetPageSize()
    // Check if page size changed
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      // Reset to page 1 and refresh datasource with new page size
      const datasource = createDatasource(newPageSize)
      params.api.setGridOption('datasource', datasource)
      params.api.paginationGoToPage(0) // Go to first page (0-indexed)
    }
  }, [pageSize, createDatasource])

  const updateSelectionState = useCallback(() => {
    if (!gridApiRef.current) return
    setSelectedRows(gridApiRef.current.getSelectedRows())
  }, [])

  const onSelectionChanged = useCallback(() => {
    updateSelectionState()
  }, [updateSelectionState])

  const handleSelectAll = useCallback(() => {
    if (!gridApiRef.current) return
    // For infinite row model, select all filtered rows
    gridApiRef.current.selectAllFiltered()
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
      
      refreshGrid()
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
  }, [selectedRows, refreshGrid])

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
                  refreshGrid()
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
                    refreshGrid()
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
                  <Button variant="outline-secondary" size="sm" onClick={handleSelectAll} disabled={!fund_id || totalRecords === 0}>
                    Select All
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={handleClearSelection} disabled={!selectedRows.length}>
                    Clear Selection
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={handleBulkDelete} disabled={!selectedRows.length || bulkActionLoading}>
                    {bulkActionLoading ? 'Deleting…' : `Delete Selected (${selectedCount})`}
                  </Button>
                  <span className="text-muted ms-auto">
                    Selected: {selectedCount} / {totalRecords}
                  </span>
                </div>
                <div style={{ height: '600px', width: '100%', position: 'relative' }}>
                  {(loading || initialLoading) && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <Spinner animation="border" variant="primary" />
                      <span className="text-muted">Loading symbols...</span>
                    </div>
                  )}
                  <AgGridReact
                    onGridReady={onGridReady}
                    onSelectionChanged={onSelectionChanged}
                    onPaginationChanged={onPaginationChanged}
                    rowModelType="infinite"
                    columnDefs={symbolColDefs}
                    pagination={true}
                    paginationPageSize={pageSize}
                    paginationPageSizeSelector={[10, 25, 50, 100]}
                    rowSelection="multiple"
                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                    cacheBlockSize={pageSize}
                    maxBlocksInCache={10}
                    infiniteInitialRowCount={pageSize}
                    context={{ handleEdit, handleDelete }}
                    suppressRowClickSelection={false}
                    overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading symbols...</span>' : undefined}
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
