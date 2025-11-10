'use client' // ✅ Ensures this is a Client Component

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Button, Modal, Tabs, Tab, Alert } from 'react-bootstrap'
import { UploadManualJournalModal } from '../base-ui/modals/components/AllModals'
import { AgGridReact } from 'ag-grid-react'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import api from '@/lib/api/axios'
import { formatYmd } from '@/lib/dateFormat'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { AddManualJournal } from '../forms/validation/components/AllFormValidation'

const ManualJournalPage = () => {
  const [fundId, setFundId] = useState(null)
  // grid data
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  // simple pagination (client-side, since you asked for GET '/')
  const [pageSize, setPageSize] = useState(20)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [historyRows, setHistoryRows] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [activeTab, setActiveTab] = useState('list')

  // decode token to get fund_id
  useEffect(() => {
    const token = Cookies.get('dashboardToken')
    if (!token) return
    try {
      const d = jwtDecode(token)
      setFundId(d.fund_id)
    } catch (e) {
      console.error('jwt decode failed', e)
    }
  }, [])

  // register AG Grid modules (handles different versions)
  // useEffect(() => {
  //   ;(async () => {
  //     try {
  //       const mod = await import('ag-grid-community')
  //       const toRegister = []

  //       // v31+ (module-based)
  //       if (mod.ClientSideRowModelModule) toRegister.push(mod.ClientSideRowModelModule)
  //       if (mod.AllCommunityModule) toRegister.push(mod.AllCommunityModule)

  //       if (mod.ModuleRegistry && toRegister.length) {
  //         mod.ModuleRegistry.registerModules(toRegister)
  //       }
  //     } catch (err) {
  //       console.warn('AG Grid module registration skipped:', err)
  //     }
  //   })()
  // }, [])

  useEffect(() => {
    if (!fundId) {
      setRows([])
      return
    }

    let ignore = false
    setLoading(true)

    const load = async () => {
      try {
        const res = await api.get(`/api/v1/manualjournal/${fundId}`)
        const data = Array.isArray(res.data?.data) ? res.data.data : res.data || []
        if (!ignore) setRows(data)
      } catch (error) {
        console.error('fetch manual journals failed:', error)
        if (!ignore) setRows([])
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [fundId])

  const closeFormModal = () => {
    setShowFormModal(false)
    setEditingRow(null)
  }

  const openCreateModal = () => {
    setEditingRow(null)
    setShowFormModal(true)
  }

  const openEditModal = (row) => {
    setEditingRow(row)
    setShowFormModal(true)
  }

  const fetchHistory = useCallback(async () => {
    if (!fundId) {
      setHistoryRows([])
      return
    }

    setHistoryLoading(true)
    setHistoryError('')

    try {
      const res = await api.get(`/api/v1/manualjournal/upload/history/${fundId}`)
      const payload = res?.data ?? []

      let rows = []
      if (Array.isArray(payload)) rows = payload
      else if (Array.isArray(payload?.rows)) rows = payload.rows
      else if (Array.isArray(payload?.data)) rows = payload.data
      else if (Array.isArray(payload?.data?.rows)) rows = payload.data.rows
      else rows = []

      const normalized = rows.map((row) => ({
        ...row,
        uploaded_at: row.uploaded_at || row.date_and_time || row.created_at || null,
      }))
      setHistoryRows(normalized)

      const topLevelFailed = typeof payload === 'object' && payload !== null && payload.status === 'Validation Failed'
      const rowFailed = rows.some((row) => String(row.status || '').toLowerCase() === 'validation failed')
      if (topLevelFailed || rowFailed) {
        alert('Manual journal upload validation failed. Check loader history for details.')
      }
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to load upload history'
      setHistoryError(message)
      setHistoryRows([])
    } finally {
      setHistoryLoading(false)
    }
  }, [fundId])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab, fetchHistory])

  const handleFormSuccess = () => {
    if (fundId) {
      // refresh list
      setLoading(true)
      api
        .get(`/api/v1/manualjournal/${fundId}`)
        .then((res) => {
          const data = Array.isArray(res.data?.data) ? res.data.data : res.data || []
          setRows(data)
        })
        .catch((error) => {
          console.error('fetch manual journals failed:', error)
          setRows([])
        })
        .finally(() => {
          setLoading(false)
        })

      if (activeTab === 'history') {
        fetchHistory()
      }
    }
  }

  const handleDelete = async (row) => {
    const entryId = row?.journal_id || row?._id || row?.id
    if (!entryId) {
      window.alert('Unable to delete: missing manual journal identifier.')
      return
    }

    const confirmation = window.confirm('Are you sure you want to delete this manual journal entry?')
    if (!confirmation) return

    setLoading(true)
    try {
      const deleteUrl = fundId ? `/api/v1/manualjournal/${fundId}/${entryId}` : `/api/v1/manualjournal/${entryId}`
      await api.delete(deleteUrl)
      window.alert('Manual journal deleted successfully ✅')

      // refresh list
      const res = await api.get(`/api/v1/manualjournal/${fundId}`)
      const data = Array.isArray(res.data?.data) ? res.data.data : res.data || []
      setRows(data)

      if (activeTab === 'history') {
        fetchHistory()
      }
    } catch (error) {
      const status = error?.response?.status
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to delete manual journal'
      console.error('DELETE /manualjournal failed', { status, error })
      window.alert(message)
    } finally {
      setLoading(false)
    }
  }

  const dashboard = useDashboardToken()
  const fmt = dashboard?.date_format || 'MM/DD/YYYY'

  // columns (safe defaults)
  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Date',
        field: 'journal_date',
        sortable: true,
        filter: true,
        flex: 1,
        valueFormatter: (p) => {
          const raw = p?.value ? String(p.value).slice(0, 10) : ''
          return raw ? formatYmd(raw, fmt) : ''
        },
      },
      { headerName: 'Dr Account', field: 'dr_account', sortable: true, filter: true, flex: 1 },
      { headerName: 'Cr Account', field: 'cr_account', sortable: true, filter: true, flex: 1 },
      {
        headerName: 'Amount',
        field: 'amount',
        sortable: true,
        filter: true,
        width: 120,
        valueFormatter: (p) => (p.value != null ? Number(p.value).toLocaleString() : ''),
        cellClass: 'text-end',
        flex: 1,
      },
      { headerName: 'Description', field: 'description', flex: 1 },
      {
        headerName: 'Actions',
        field: 'actions',
        sortable: false,
        filter: false,
        suppressMenu: true,
        width: 160,
        cellRenderer: (params) => {
          const { data, context } = params
          const handleEditRow = context?.handleEdit
          const handleDeleteRow = context?.handleDelete

          return (
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEditRow?.(data)}>
                Edit
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRow?.(data)}>
                Delete
              </button>
            </div>
          )
        },
      },
    ],
    [fmt],
  )

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
    ],
    [],
  )

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Manual Journal</CardTitle>
            <div className="d-flex gap-2">
              <Button variant="primary" onClick={openCreateModal}>
                Add
              </Button>
              <UploadManualJournalModal
                onClose={() => {
                  if (fundId) {
                    api
                      .get(`/api/v1/manualjournal/${fundId}`)
                      .then((res) => {
                        const data = Array.isArray(res.data?.data) ? res.data.data : res.data || []
                        setRows(data)
                      })
                      .catch((error) => {
                        console.error('fetch manual journals failed:', error)
                        setRows([])
                      })

                    if (activeTab === 'history') {
                      fetchHistory()
                    }
                  }
                }}
              />
            </div>
          </CardHeader>
          <Tabs
            activeKey={activeTab}
            id="manual-journal-tabs"
            className="px-3 pt-3"
            onSelect={(key) => {
              setActiveTab(key || 'list')
            }}
          >
            <Tab eventKey="list" title="Manual Journal List">
              <CardBody className="p-2">
                {!fundId && (
                  <Alert variant="warning" className="mb-3">
                    Select a fund to view manual journals.
                  </Alert>
                )}

                <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
                  {/* Guard so we don’t mount grid before columns */}
                  {columnDefs.length > 0 ? (
                    <AgGridReact
                      rowData={rows}
                      columnDefs={columnDefs}
                      pagination={true}
                      paginationPageSize={pageSize}
                      defaultColDef={{ sortable: true, filter: true, resizable: true }}
                      context={{ handleEdit: openEditModal, handleDelete }}
                    />
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100">Loading grid…</div>
                  )}
                </div>
              </CardBody>
            </Tab>
            <Tab eventKey="history" title="Loader History">
              <CardBody className="p-2">
                {!fundId && (
                  <Alert variant="warning" className="mb-3">
                    Select a fund to view upload history.
                  </Alert>
                )}

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div />
                  <Button variant="outline-secondary" size="sm" onClick={fetchHistory} disabled={!fundId || historyLoading}>
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

      <Modal show={showFormModal} onHide={closeFormModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingRow ? 'Edit Manual Journal' : 'Add Manual Journal'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AddManualJournal
            key={editingRow?.journal_id || editingRow?._id || editingRow?.id || 'new'}
            onClose={closeFormModal}
            onSuccess={handleFormSuccess}
            initialData={editingRow}
            mode={editingRow ? 'edit' : 'create'}
          />
        </Modal.Body>
      </Modal>
    </Row>
  )
}

export default ManualJournalPage
