'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Dropdown, Spinner, Alert, Button } from 'react-bootstrap'
import api from '../../../lib/api/axios'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { useDashboardToken } from '@/hooks/useDashboardToken'
import { formatYmd } from '../../../../src/lib/dateFormat'
import { journalColDefs as sharedJournalColDefs } from '@/assets/tychiData/columnDefs'
import { buildAoaFromHeaders, exportAoaToXlsx } from '@/lib/exporters/xlsx'

const AgGridReact = dynamic(() => import('ag-grid-react').then((mod) => mod.AgGridReact), { ssr: false })
const MGLEntryModal = dynamic(() => import('../base-ui/modals/components/AllModals').then((mod) => mod.MGLEntryModal), { ssr: false })

const JournalsPage = () => {
  const [rowData, setRowData] = useState([])
  const [columnDefs, setColumnDefs] = useState([])
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [fundId, setFundId] = useState('')
  const gridApiRef = useRef(null)

  const defaultJournalColDefs = useMemo(
    () => [
      { headerName: 'Sr.No', valueGetter: 'node.rowIndex + 1', width: 70, pinned: 'left', flex: 1 },
      { field: 'journal_date', headerName: 'Date', filter: 'agDateColumnFilter', flex: 1 },
      { field: 'journal_type', headerName: 'Type' },
      { field: 'amount', headerName: 'Amount', flex: 1 },
      { field: 'dr_account', headerName: 'DR Account', flex: 1 },
      { field: 'cr_account', headerName: 'CR Account', flex: 1 },
      { field: 'document_number', headerName: 'Document No.', flex: 1 },
    ],
    [],
  )

  // 1) Get fundId from dashboardToken cookie (support multiple key styles)
  useEffect(() => {
    const token = Cookies.get('dashboardToken')
    if (!token) {
      setErrMsg('dashboardToken cookie not found')
      return
    }
    try {
      const payload = jwtDecode(token)
      console.log('[Journals] decoded token payload:', payload)
      const id = payload?.fund_id || payload?.fundId || payload?.context?.fund_id || ''
      if (!id) {
        setErrMsg('fund_id not present in token')
        return
      }
      setFundId(id)
    } catch (e) {
      console.error('[Journals] token decode error:', e)
      setErrMsg('Invalid dashboard token')
    }
  }, [])

  // 2) Load columns + register AG Grid
  useEffect(() => {
    setColumnDefs(defaultJournalColDefs) // <— force journal columns

    if (typeof window !== 'undefined') {
      import('ag-grid-community')
        .then(({ ModuleRegistry, AllCommunityModule }) => {
          ModuleRegistry.registerModules([AllCommunityModule])
        })
        .catch(() => {})
    }
  }, [defaultJournalColDefs])

  // 3) Fetch journals once fundId is known
  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        setLoading(true)
        setErrMsg((prev) => (prev === 'Missing fundId' ? '' : prev))

        if (!fundId) {
          setErrMsg('Missing fundId')
          return
        }

        const url = `/api/v1/journals/fund/${fundId}` // NOTE: plural "journals"
        if (typeof window !== 'undefined') {
          console.log('[Journals] GET', process.env.NEXT_PUBLIC_API_URL, url)
        }

        const { data } = await api.get(url) // api baseURL should be :5000 or proxied
        if (!ignore) setRowData(Array.isArray(data?.data) ? data.data : [])
      } catch (err) {
        console.error('GET journals failed:', err?.message, err?.response?.status, err?.response?.data)
        if (!ignore) setErrMsg(err?.response?.data?.message || err?.message || 'Failed to load journals')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [fundId])


  const dashboard = useDashboardToken()
  const fmt = dashboard?.date_format || 'MM/DD/YYYY'
  // Optional UX: show a lightweight state until token is ready
  // define columnDefs here (NOT inside JSX)
  const columnDefsfordate = useMemo(() => {
    return (defaultJournalColDefs || []).map((col) => {
      if (col?.field !== 'journal_date') return col
      return {
        ...col,
        valueFormatter: (p) => {
          const raw = p?.value ? String(p.value).slice(0, 10) : ''
          return formatYmd(raw, fmt) // 'MM/DD/YYYY' or 'DD/MM/YYYY'
        },
      }
    })
  }, [fmt])

  const fetchData = async () => {
    if (!fundId) return;
    try {
      setLoading(true);
      const res = await api.get('/api/v1/manualjournal', {
        params: {
          fund_id: fundId, page, pageSize,
          from: from || undefined,
          to: to || undefined,
          q: q || undefined,
        }
      });
      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error('fetch manual journals failed:', e);
      setRows([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Grid ready callback to store grid API reference
  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  // Export headers for journals
  const journalExportHeaders = useMemo(
    () =>
      (defaultJournalColDefs || [])
        .filter((col) => col.field)
        .map((col) => ({ key: col.field, label: col.headerName || col.field })),
    [defaultJournalColDefs],
  )

  // Format export values
  const formatExportValue = useCallback(
    (key, value) => {
      if (key === 'journal_date') {
        const raw = value ? String(value).slice(0, 10) : ''
        return raw ? formatYmd(raw, fmt) : ''
      }
      return value ?? ''
    },
    [fmt],
  )

  // CSV escape helper
  const escapeCsv = useCallback((value) => {
    const stringValue = String(value ?? '')
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return '"' + stringValue.replace(/"/g, '""') + '"'
    }
    return stringValue
  }, [])

  // Export only filtered rows (rows visible after user filters/searches)
  const handleExport = useCallback(
    (format) => {
      // Step 1️⃣ - Get all rows visible after filter/search
      const visibleRows = []
      if (gridApiRef.current) {
        gridApiRef.current.forEachNodeAfterFilterAndSort((node) => {
          if (node.data) {
            visibleRows.push(node.data)
          }
        })
      }

      // If no filtered rows, fall back to all rows
      const rowsToExport = visibleRows.length > 0 ? visibleRows : rowData

      if (!rowsToExport.length) {
        alert('No journal records to export. Please check your filters or add some journals.')
        return
      }

      // Step 2️⃣ - Convert to export format using headers and formatter
      const aoa = buildAoaFromHeaders(journalExportHeaders, rowsToExport, formatExportValue)

      // Step 3️⃣ - Export based on format
      const exportDate = new Date().toISOString().slice(0, 10)
      if (format === 'xlsx') {
        exportAoaToXlsx({
          fileName: `journals-filtered-${fundId || 'fund'}-${exportDate}`,
          sheetName: 'Journals',
          aoa,
        })
        return
      }

      // Step 4️⃣ - Create CSV file and download
      const headerRow = journalExportHeaders.map(({ label }) => escapeCsv(label)).join(',')
      const dataRows = aoa.map((row) => row.map((cell) => escapeCsv(cell)).join(','))
      const csvContent = ['\ufeff' + headerRow, ...dataRows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `journals-filtered-${fundId || 'fund'}-${exportDate}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    [rowData, journalExportHeaders, formatExportValue, escapeCsv, fundId],
  )
  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Journals</CardTitle>
            <div className="d-flex gap-2">
              <Button
                variant="outline-success"
                size="sm"
                disabled={!rowData?.length || loading}
                onClick={() => handleExport('csv')}
              >
                ExportCSV
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                disabled={!rowData?.length || loading}
                onClick={() => handleExport('xlsx')}
              >
                Export XLSX
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-2">
            {errMsg && (
              <Alert variant="danger" className="mb-2">
                {errMsg}
              </Alert>
            )}
            {loading ? (
              <div className="d-flex align-items-center gap-2 p-3">
                <Spinner animation="border" size="sm" /> <span>Loading…</span>
              </div>
            ) : (
              <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
                {columnDefs.length > 0 && (
                  <AgGridReact
                    onGridReady={onGridReady}
                    rowData={rowData}
                    columnDefs={columnDefsfordate}
                    pagination
                    paginationPageSize={10}
                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                  />
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default JournalsPage
