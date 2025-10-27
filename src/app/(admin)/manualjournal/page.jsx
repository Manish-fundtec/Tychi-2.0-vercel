'use client' // ✅ Ensures this is a Client Component

import { useEffect, useState, useMemo } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Dropdown } from 'react-bootstrap'
import { MGLEntryModal , UploadManualJournalModal } from '../base-ui/modals/components/AllModals'
import { AgGridReact } from 'ag-grid-react'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import api from '@/lib/api/axios'
import { formatYmd } from '@/lib/dateFormat'
import {useDashboardToken} from '@/hooks/useDashboardToken'

const ManualJournalPage = () => {
  const [fundId, setFundId] = useState(null)
  // grid data
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  // simple pagination (client-side, since you asked for GET '/')
  const [pageSize, setPageSize] = useState(20)

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

  // fetch journals
  const fetchJournals = async () => {
    if (!fundId) return
    setLoading(true)
    try {
      // ✅ Your route: router.get('/', getManualJournals)
      // If your backend expects fund_id as a query param:
      const res = await api.get(`/api/v1/manualjournal/${fundId}`)
      const data = Array.isArray(res.data?.data) ? res.data.data : res.data || []
      setRows(data)
    } catch (e) {
      console.error('fetch manual journals failed:', e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournals()
  }, [fundId])

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
              <MGLEntryModal />
              <UploadManualJournalModal />
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
                />
              ) : (
                <div className="d-flex justify-content-center align-items-center h-100">Loading grid…</div>
              )}
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default ManualJournalPage
