'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Alert, Tabs, Tab, Button } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import { UploadMigrationModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
import MigrationComparisonModal from './components/MigrationComparisonModal'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import api from '@/lib/api/axios'
import { getMigrationTableData } from '@/lib/api/migration'

const AgGridReact = dynamic(() => import('ag-grid-react').then((mod) => mod.AgGridReact), { ssr: false })

const MigrationPage = () => {
  const [rowData, setRowData] = useState([])
  const [columnDefs, setColumnDefs] = useState([])
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const [currentFileId, setCurrentFileId] = useState(null)
  
  // History tab states
  const [historyRows, setHistoryRows] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  
  const gridApiRef = useRef(null)
  const tokenData = useDashboardToken()
  const fundId = tokenData?.fund_id

  const defaultColumnDefs = useMemo(
    () => [
      { headerName: 'Sr.No', valueGetter: 'node.rowIndex + 1', width: 70, pinned: 'left', flex: 1 },
      { field: 'account_code', headerName: 'Account Code', flex: 1, sortable: true, filter: true },
      { field: 'account_name', headerName: 'Account Name', flex: 1, sortable: true, filter: true },
      { field: 'opening_balance', headerName: 'Opening Balance', flex: 1, sortable: true, 
        valueFormatter: (params) => params.value ? Number(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—' },
      { field: 'debit', headerName: 'Debit', flex: 1, sortable: true,
        valueFormatter: (params) => params.value ? Number(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—' },
      { field: 'credit', headerName: 'Credit', flex: 1, sortable: true,
        valueFormatter: (params) => params.value ? Number(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—' },
      { field: 'Closing balance', headerName: 'Closing Balance', flex: 1, sortable: true,
        valueFormatter: (params) => params.value ? Number(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—' },
      {
        headerName: 'Actions',
        field: 'actions',
        sortable: false,
        filter: false,
        width: 120,
        pinned: 'right',
        cellRenderer: (params) => {
          const { data } = params
          const fileId = data?.file_id
          
          if (fileId) {
            return (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCurrentFileId(fileId)
                  setShowComparisonModal(true)
                }}>
                View
              </Button>
            )
          }
          return '—'
        },
      },
    ],
    [],
  )

  // Load columns + register AG Grid
  useEffect(() => {
    setColumnDefs(defaultColumnDefs)

    if (typeof window !== 'undefined') {
      import('ag-grid-community')
        .then(({ ModuleRegistry, AllCommunityModule }) => {
          ModuleRegistry.registerModules([AllCommunityModule])
        })
        .catch(() => {})
    }
  }, [defaultColumnDefs])

  // Grid ready callback to store grid API reference
  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  // Handle success after upload - open comparison modal
  const handleUploadSuccess = (fileId) => {
    if (fileId) {
      setCurrentFileId(fileId)
    }
    setShowComparisonModal(true)
    // Refresh data based on active tab
    if (activeTab === 'history') {
      fetchHistory()
    } else if (activeTab === 'list') {
      fetchMigrationData()
    }
  }

  // Fetch upload history - simple function like beginner can understand
  const fetchHistory = useCallback(async () => {
    if (!fundId) {
      setHistoryRows([])
      return
    }

    setHistoryLoading(true)
    setHistoryError('')

    try {
      // Call API to get migration upload history
      // Updated: Response is now a direct array [{ file_id, file_name, status, uploaded_at, user_id }, ...]
      const res = await api.get(`/api/v1/migration/upload/history/${fundId}`)
      
      // Response is direct array, not wrapped in object
      let rows = []
      if (Array.isArray(res?.data)) {
        rows = res.data
      } else if (Array.isArray(res)) {
        rows = res
      } else {
        rows = []
      }

      // Normalize the data (make sure uploaded_at field exists)
      const normalized = rows.map((row) => ({
        ...row,
        uploaded_at: row.uploaded_at || row.date_and_time || row.created_at || null,
      }))
      
      setHistoryRows(normalized)
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to load upload history'
      setHistoryError(message)
      setHistoryRows([])
    } finally {
      setHistoryLoading(false)
    }
  }, [fundId])

  // Fetch migration table data
  const fetchMigrationData = useCallback(async () => {
    if (!fundId) {
      setRowData([])
      return
    }

    setLoading(true)
    setErrMsg('')

    try {
      // Call API to get migration table data
      const res = await getMigrationTableData(fundId)
      
      // Handle response - could be array or object with data property
      let data = []
      if (Array.isArray(res?.data)) {
        data = res.data
      } else if (res?.data?.data && Array.isArray(res.data.data)) {
        data = res.data.data
      } else if (Array.isArray(res)) {
        data = res
      }

      // Normalize the data to match column definitions
      const normalized = data.map((row) => ({
        account_code: row.account_code || row.gl_code || '',
        account_name: row.account_name || row.gl_name || '',
        opening_balance: Number(row.opening_balance || row.opening || 0),
        debit: Number(row.debit || row.debit_amount || 0),
        credit: Number(row.credit || row.credit_amount || 0),
        'Closing balance': Number(row['Closing balance'] || row.closing_balance || row.closing || 0),
        file_id: row.file_id || null, // Include file_id for action button
      }))
      
      setRowData(normalized)
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to load migration data'
      setErrMsg(message)
      setRowData([])
    } finally {
      setLoading(false)
    }
  }, [fundId])

  // Fetch migration data when "Migration Data" tab is selected
  useEffect(() => {
    if (activeTab === 'list') {
      fetchMigrationData()
    }
  }, [activeTab, fetchMigrationData])

  // Fetch history when history tab is selected
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab, fetchHistory])

  // History table columns - simple and clear
  const historyColDefs = useMemo(
    () => [
      { headerName: 'File ID', field: 'file_id', sortable: true, filter: true, width: 220 },
      { headerName: 'File Name', field: 'file_name', sortable: true, filter: true, flex: 1 },
      { headerName: 'Status', field: 'status', sortable: true, filter: true, flex: 1 },
      {
        headerName: 'Uploaded At',
        field: 'uploaded_at',
        sortable: true,
        filter: true,
        flex: 1,
        valueGetter: (params) => (params.data?.uploaded_at ? new Date(params.data.uploaded_at).toLocaleString() : ''),
      },
      { headerName: 'Uploaded By', field: 'user_id', sortable: true, filter: true, flex: 1 },
      {
        headerName: 'Pending Actions',
        field: 'actions',
        sortable: false,
        filter: false,
        width: 150,
        cellRenderer: (params) => {
          const { data } = params
          const fileId = data?.file_id
          const status = String(data?.status || '').toLowerCase()
          
          // Only show button if status is "pending"
          if (status === 'pending' && fileId) {
            return (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCurrentFileId(fileId)
                  setShowComparisonModal(true)
                }}>
                View
              </Button>
            )
          }
          return '—'
        },
      },
    ],
    [],
  )

  return (
    <>
      <PageTitle title="Migration" subName="General Ledger" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
              <CardTitle as="h4">Migration Data</CardTitle>
              <UploadMigrationModal 
                buttonLabel="Upload" 
                modalTitle="Upload Migration File"
                onSuccess={handleUploadSuccess}
                onUploadSuccess={handleUploadSuccess}
              />
            </CardHeader>
            
            {/* Tabs for List and History */}
            <Tabs
              activeKey={activeTab}
              id="migration-tabs"
              className="px-3 pt-3"
              onSelect={(key) => {
                setActiveTab(key || 'list')
              }}
            >
              {/* Tab 1: Migration Data List */}
              <Tab eventKey="list" title="Migration Data">
                <CardBody className="p-2">
                  {!fundId && (
                    <Alert variant="warning" className="mb-3">
                      Select a fund to view migration data.
                    </Alert>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={fetchMigrationData}
                      disabled={!fundId || loading}>
                      {loading ? 'Refreshing…' : 'Refresh'}
                    </Button>
                  </div>

                  {errMsg && (
                    <Alert variant="danger" className="mb-2" dismissible onClose={() => setErrMsg('')}>
                      {errMsg}
                    </Alert>
                  )}
                  
                  {loading && (
                    <div className="d-flex align-items-center gap-2 p-3">
                      <Spinner animation="border" size="sm" /> <span>Loading…</span>
                    </div>
                  )}

                  {!loading && !errMsg && rowData.length === 0 && (
                    <Alert variant="warning" className="mb-2">
                      No migration data found for this fund.
                    </Alert>
                  )}

                  {!loading && (
                    <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
                      {columnDefs.length > 0 && (
                        <AgGridReact
                          onGridReady={onGridReady}
                          rowData={rowData}
                          columnDefs={columnDefs}
                          pagination
                          paginationPageSize={10}
                          paginationPageSizeSelector={[10, 25, 50, 100]}
                          defaultColDef={{ sortable: true, filter: true, resizable: true }}
                        />
                      )}
                    </div>
                  )}
                </CardBody>
              </Tab>

              {/* Tab 2: Loader History */}
              <Tab eventKey="history" title="Loader History">
                <CardBody className="p-2">
                  {!fundId && (
                    <Alert variant="warning" className="mb-3">
                      Select a fund to view upload history.
                    </Alert>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={fetchHistory}
                      disabled={!fundId || historyLoading}>
                      {historyLoading ? 'Refreshing…' : 'Refresh'}
                    </Button>
                  </div>

                  {historyError && (
                    <Alert variant="danger" className="mb-2">
                      {historyError}
                    </Alert>
                  )}

                  {historyLoading && (
                    <Alert variant="info" className="mb-2">
                      Loading upload history...
                    </Alert>
                  )}

                  {!historyLoading && !historyError && historyRows.length === 0 && (
                    <Alert variant="warning" className="mb-2">
                      No upload history found for this fund.
                    </Alert>
                  )}

                  <div className="ag-theme-alpine" style={{ width: '100%' }}>
                    <AgGridReact
                      rowData={historyRows}
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
          </Card>
        </Col>
      </Row>

      {/* Comparison Modal */}
      <MigrationComparisonModal
        show={showComparisonModal}
        onClose={() => {
          setShowComparisonModal(false)
          setCurrentFileId(null) // Reset fileId when modal closes
        }}
        fundId={fundId}
        fileId={currentFileId}
        onRefreshHistory={() => {
          // Simple function to refresh history
          if (activeTab === 'history') {
            fetchHistory()
          }
        }}
      />
    </>
  )
}

export default MigrationPage
