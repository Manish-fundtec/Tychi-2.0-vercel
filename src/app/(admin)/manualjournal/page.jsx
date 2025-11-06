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
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

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

  const fetchJournals = useCallback(async () => {
    if (!fundId) return
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/manualjournal/${fundId}`)
      const data = Array.isArray(res.data?.data) ? res.data.data : res.data || []
      setRows(data)
    } catch (e) {
      console.error('fetch manual journals failed:', e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [fundId])

  useEffect(() => {
    fetchJournals()
  }, [fetchJournals])

  const closeFormModal = useCallback(() => {
    setShowFormModal(false)
    setEditingRow(null)
  }, [])

  const openCreateModal = useCallback(() => {
    setEditingRow(null)
    setShowFormModal(true)
  }, [])

  const openEditModal = useCallback((row) => {
    setEditingRow(row)
    setShowFormModal(true)
  }, [])

  const handleFormSuccess = useCallback(() => {
    fetchJournals()
  }, [fetchJournals])

  const handleDelete = useCallback(
    async (row) => {
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
        fetchJournals()
      } catch (error) {
        const status = error?.response?.status
        const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to delete manual journal'
        console.error('DELETE /manualjournal failed', { status, error })
        window.alert(message)
      } finally {
        setLoading(false)
      }
    },
    [fetchJournals, fundId],
  )

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
              <UploadManualJournalModal onClose={fetchJournals} />
            </div>
          </CardHeader>
          <CardBody className="p-2">
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
