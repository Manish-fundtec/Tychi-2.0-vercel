'use client' // ✅ Ensures this is a Client Component

import { useEffect, useState, useMemo, useCallback } from 'react'
import './manualjournal.css'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Button, Modal, ModalHeader, ModalBody, Tabs, Tab, Alert } from 'react-bootstrap'
import { UploadManualJournalModal } from '../base-ui/modals/components/AllModals'
import { AgGridReact } from 'ag-grid-react'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import api from '@/lib/api/axios'
import { formatYmd } from '@/lib/dateFormat'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { useUserToken } from '@/hooks/useUserToken'
import { AddManualJournal } from '../forms/validation/components/AllFormValidation'
import currencies from 'currency-formatter/currencies'
import { getFundDetails } from '@/lib/api/fund'
import { getUserRolePermissions } from '@/helpers/getUserPermissions'
import { canModuleAction } from '@/helpers/permissionActions'

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
  const [fundDetails, setFundDetails] = useState(null)

  // Permissions state
  const [permissions, setPermissions] = useState([])
  const [loadingPermissions, setLoadingPermissions] = useState(true)

  // Hooks - must be declared before useEffects that use them
  const dashboard = useDashboardToken()
  const userToken = useUserToken()
  
  // Derived values from hooks
  const fmt = dashboard?.date_format || 'MM/DD/YYYY'
  const fund_id = dashboard?.fund_id || fundId || ''

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

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      // Use dashboard first, then fallback to userToken
      const tokenData = dashboard || userToken;
      
      if (!tokenData) {
        console.warn('⚠️ Manual Journal - No tokenData available yet, will retry when token loads');
        return;
      }
      
      // Extract fields with all possible field name variations
      const userId = tokenData?.user_id || tokenData?.id || tokenData?.userId || tokenData?.sub;
      const roleId = tokenData?.role_id || tokenData?.roleId;
      const orgId = tokenData?.org_id || tokenData?.organization_id || tokenData?.orgId;
      
      // Ensure we have at least user_id or org_id to fetch permissions
      const hasUserId = !!userId;
      const hasOrgId = !!orgId;
      
      if (!hasUserId && !hasOrgId) {
        console.warn('⚠️ Manual Journal - Token missing user_id and org_id, cannot fetch permissions');
        setLoadingPermissions(false);
        return;
      }
      
      try {
        setLoadingPermissions(true);
        const currentFundId = fund_id || fundId;
        
        // Check if permissions are in token first, otherwise fetch from API
        let perms = [];
        
        if (tokenData?.permissions && Array.isArray(tokenData.permissions)) {
          // Permissions are in token - filter by fundId if provided
          perms = tokenData.permissions;
          
          if (currentFundId) {
            perms = perms.filter(p => {
              const pFundId = p?.fund_id || p?.fundId;
              return pFundId == currentFundId || String(pFundId) === String(currentFundId);
            });
          }
        } else {
          // Permissions not in token - fetch from API
          try {
            perms = await getUserRolePermissions(tokenData, currentFundId);
          } catch (permError) {
            console.error('❌ Manual Journal - getUserRolePermissions ERROR:', permError);
            perms = [];
          }
        }
        
        const permissionsToSet = Array.isArray(perms) ? perms : [];
        setPermissions(permissionsToSet);
      } catch (error) {
        console.error('❌ Manual Journal - Error fetching permissions:', error);
        setPermissions([]);
      } finally {
        setLoadingPermissions(false);
      }
    };
    
    fetchPermissions();
  }, [userToken, dashboard, fund_id, fundId]);

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

  // Permission checks for manual journal module (after hooks are declared)
  const currentFundId = fund_id || fundId;
  const canAdd = canModuleAction(permissions, ['manual_journal', 'manualjournal', 'journal'], 'can_add', currentFundId);
  const canEdit = canModuleAction(permissions, ['manual_journal', 'manualjournal', 'journal'], 'can_edit', currentFundId);
  const canDelete = canModuleAction(permissions, ['manual_journal', 'manualjournal', 'journal'], 'can_delete', currentFundId);
  
  // Fetch fund details to get current decimal_precision
  useEffect(() => {
    if (!fundId) {
      setFundDetails(null)
      return
    }
    
    const fetchFund = async () => {
      try {
        const details = await getFundDetails(fundId)
        setFundDetails(details)
      } catch (error) {
        console.error('Failed to fetch fund details:', error)
        setFundDetails(null)
      }
    }
    
    fetchFund()
  }, [fundId])
  
  // Get decimal precision - prioritize fund details from API, then token, then default to 2
  const decimalPrecision = useMemo(() => {
    const apiPrecision = fundDetails?.decimal_precision
    const tokenPrecision = dashboard?.decimal_precision ?? dashboard?.fund?.decimal_precision
    const precision = apiPrecision ?? tokenPrecision
    const numPrecision = precision !== null && precision !== undefined ? Number(precision) : null
    return numPrecision !== null && !isNaN(numPrecision) ? numPrecision : 2
  }, [fundDetails, dashboard])
  
  // Get currency symbol from reporting_currency
  const currencySymbol = useMemo(() => {
    const reportingCurrency = dashboard?.reporting_currency || dashboard?.fund?.reporting_currency || ''
    if (!reportingCurrency) return ''
    const currency = currencies.find((c) => c.code === reportingCurrency)
    return currency?.symbol || ''
  }, [dashboard])

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
        valueFormatter: (p) => {
          const value = p?.value
          if (value === null || value === undefined || value === '') return '—'
          const num = Number(value)
          if (Number.isNaN(num)) return value
          const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
          return currencySymbol ? `${currencySymbol}${formatted}` : formatted
        },
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
          const canEdit = context?.canEdit === true
          const canDelete = context?.canDelete === true

          return (
            <div className="d-flex gap-2">
              {canEdit && (
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEditRow?.(data)}>
                  Edit
                </button>
              )}
              {canDelete && (
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRow?.(data)}>
                  Delete
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [fmt, currencySymbol, decimalPrecision],
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
              {canAdd && (
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
              )}
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
                      context={{ 
                        handleEdit: openEditModal, 
                        handleDelete,
                        canEdit: canEdit,
                        canDelete: canDelete,
                      }}
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
        <ModalHeader closeButton>
          <h5 className="modal-title">{editingRow ? 'Edit Manual Journal' : 'Add Manual Journal'}</h5>
        </ModalHeader>
        <ModalBody>
          <AddManualJournal
            key={editingRow?.journal_id || editingRow?._id || editingRow?.id || 'new'}
            onClose={closeFormModal}
            onSuccess={handleFormSuccess}
            initialData={editingRow}
            mode={editingRow ? 'edit' : 'create'}
          />
        </ModalBody>
      </Modal>
    </Row>
  )
}

export default ManualJournalPage
