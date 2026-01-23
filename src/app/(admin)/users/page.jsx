'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Button } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import { AddUserModal, EditUserModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
import api from '@/lib/api/axios'
import { useNotificationContext } from '@/context/useNotificationContext'

// AG Grid (client-side only)
const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  { ssr: false }
)

const AdminUsersPage = () => {
  const gridApiRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [rowData, setRowData] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const { showNotification } = useNotificationContext()

  const refreshUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/users')
      setRowData(response.data?.data || response.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setRowData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Register AG Grid modules
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('ag-grid-community')
        .then(({ ModuleRegistry, AllCommunityModule }) => {
          ModuleRegistry.registerModules([AllCommunityModule])
        })
        .catch((err) => {
          console.error('Failed to register AG Grid modules:', err)
        })
    }
  }, [])

  // Handle delete user
  const handleDeleteUser = useCallback(async (user) => {
    const userId = user?.user_id || user?.id || user?.userId
    if (!userId) {
      showNotification({
        message: 'User ID is missing',
        variant: 'danger',
      })
      return
    }

    if (!window.confirm(`Are you sure you want to delete user "${user.first_name} ${user.last_name}"?`)) {
      return
    }

    try {
      await api.delete(`/users/${userId}`)
      showNotification({
        message: 'User deleted successfully!',
        variant: 'success',
      })
      refreshUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      showNotification({
        message: error?.response?.data?.message || 'Failed to delete user. Please try again.',
        variant: 'danger',
      })
    }
  }, [refreshUsers, showNotification])

  // Action cell renderer
  const ActionCellRenderer = useCallback((params) => {
    const user = params.data
    return (
      <div className="d-flex gap-2 justify-content-center">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setEditingUser(user)}
          title="Edit User"
        >
          Edit
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => handleDeleteUser(user)}
          title="Delete User"
        >
          Delete
        </Button>
      </div>
    )
  }, [handleDeleteUser])

  const GreenBadgeRenderer = useCallback((params) => {
    const value = params?.value ?? params?.data?.[params?.colDef?.field]
    const text = value === null || value === undefined || value === '' ? '—' : String(value)
    return <span className="badge bg-success">{text}</span>
  }, [])

  // 🔹 Column Definitions (Admin Users)
  const columnDefs = useMemo(
    () => [
      { headerName: 'Sr.No', valueGetter: 'node.rowIndex + 1', width: 80, pinned: 'left' },
      { field: 'first_name', headerName: 'First Name', flex: 1 },
      { field: 'last_name', headerName: 'Last Name', flex: 1 },
      { field: 'email', headerName: 'Email', flex: 1 },
      { field: 'phone_number', headerName: 'Phone', flex: 1 },
      { field: 'organization_name', headerName: 'Organization', flex: 1 },
      { field: 'role_name', headerName: 'Role', flex: 1 },
      { field: 'cognito_status', headerName: 'Cognito Status', flex: 1, cellRenderer: GreenBadgeRenderer },
      { field: 'status', headerName: 'Status', flex: 1, cellRenderer: GreenBadgeRenderer },
      {
        headerName: 'Actions',
        cellRenderer: ActionCellRenderer,
        width: 150,
        pinned: 'right',
        sortable: false,
        filter: false,
      },
    ],
    [ActionCellRenderer, GreenBadgeRenderer]
  )

  // Load users on mount
  useEffect(() => {
    refreshUsers()
  }, [refreshUsers])

  // 🔹 Grid Ready
  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  return (
    <>
      <PageTitle title="Admin Users" subName="Admin" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="border-bottom d-flex justify-content-between align-items-center">
              <CardTitle as="h4">Admin Users</CardTitle>
              <AddUserModal onSuccess={refreshUsers} />
            </CardHeader>
            <EditUserModal
              user={editingUser}
              onClose={() => setEditingUser(null)}
              onSuccess={() => {
                setEditingUser(null)
                refreshUsers()
              }}
            />

          <CardBody className="p-2">
            {loading ? (
              <div className="d-flex align-items-center gap-2 p-3">
                <Spinner animation="border" size="sm" />
                <span>Loading users...</span>
              </div>
            ) : (
              <div
                className="ag-theme-alpine"
                style={{ height: 500, width: '100%' }}
              >
                <AgGridReact
                  onGridReady={onGridReady}
                  rowData={rowData}
                  columnDefs={columnDefs}
                  pagination
                  paginationPageSize={10}
                  paginationPageSizeSelector={[10, 25, 50]}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                  }}
                />
              </div>
            )}
          </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default AdminUsersPage


// 'use client'

// import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
// import dynamic from 'next/dynamic'
// import { Card, CardBody, CardHeader, CardTitle, Col, Row, Dropdown, Spinner, Alert, Button } from 'react-bootstrap'
// import api from '../../../lib/api/axios'
// import Cookies from 'js-cookie'
// import { jwtDecode } from 'jwt-decode'
// import { useDashboardToken } from '@/hooks/useDashboardToken'
// import { formatYmd } from '../../../../src/lib/dateFormat'
// import { journalColDefs as sharedJournalColDefs } from '@/assets/tychiData/columnDefs'
// import { buildAoaFromHeaders, exportAoaToXlsx } from '@/lib/exporters/xlsx'
// import { getFundDetails } from '@/lib/api/fund'
// import currencies from 'currency-formatter/currencies'

// const AgGridReact = dynamic(() => import('ag-grid-react').then((mod) => mod.AgGridReact), { ssr: false })
// const MGLEntryModal = dynamic(() => import('../base-ui/modals/components/AllModals').then((mod) => mod.MGLEntryModal), { ssr: false })

// const AdminUsersPage = () => {
//   const [rowData, setRowData] = useState([])
//   const [columnDefs, setColumnDefs] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [errMsg, setErrMsg] = useState('')
//   const [fundId, setFundId] = useState('')
//   const [fundDetails, setFundDetails] = useState(null)
//   const gridApiRef = useRef(null)

//   const defaultJournalColDefs = useMemo(
//     () => [
//       { headerName: 'Sr.No', valueGetter: 'node.rowIndex + 1', width: 70, pinned: 'left', flex: 1 },
//       { field: 'journal_date', headerName: 'Date', filter: 'agDateColumnFilter', flex: 1 },
//       { field: 'journal_type', headerName: 'Type' },
//       { field: 'amount', headerName: 'Amount', flex: 1 },
//       { field: 'dr_account', headerName: 'DR Account', flex: 1 },
//       { field: 'cr_account', headerName: 'CR Account', flex: 1 },
//       { field: 'document_number', headerName: 'Document No.', flex: 1 },
//     ],
//     [],
//   )

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

//   // 2) Load columns + register AG Grid
//   useEffect(() => {
//     setColumnDefs(defaultJournalColDefs) // <— force journal columns

//     if (typeof window !== 'undefined') {
//       import('ag-grid-community')
//         .then(({ ModuleRegistry, AllCommunityModule }) => {
//           ModuleRegistry.registerModules([AllCommunityModule])
//         })
//         .catch(() => {})
//     }
//   }, [defaultJournalColDefs])

//   // 3) Fetch journals once fundId is known
//   useEffect(() => {
//     let ignore = false
//     async function load() {
//       try {
//         setLoading(true)
//         setErrMsg((prev) => (prev === 'Missing fundId' ? '' : prev))

//         if (!fundId) {
//           setErrMsg('Missing fundId')
//           return
//         }

//         const url = `/api/v1/journals/fund/${fundId}` // NOTE: plural "journals"
//         if (typeof window !== 'undefined') {
//           console.log('[Journals] GET', process.env.NEXT_PUBLIC_API_URL, url)
//         }

//         const { data } = await api.get(url) // api baseURL should be :5000 or proxied
//         const rawRows = Array.isArray(data?.data) ? data.data : []
        
//         // Sort journals: latest first (by journal_date, then created_at, then id)
//         const sortedRows = [...rawRows].sort((a, b) => {
//           // 1. Sort by journal_date (descending - latest first)
//           const dA = new Date(a.journal_date).getTime() || 0
//           const dB = new Date(b.journal_date).getTime() || 0
//           if (dA !== dB) return dB - dA

//           // 2. If same date, sort by created_at (descending - latest first)
//           const cA = new Date(a.created_at).getTime() || 0
//           const cB = new Date(b.created_at).getTime() || 0
//           if (cA !== cB) return cB - cA

//           // 3. If same, sort by id/journal_id (descending - highest first)
//           const idA = a.id || a.journal_id || 0
//           const idB = b.id || b.journal_id || 0
//           return String(idB).localeCompare(String(idA))
//         })
        
//         if (!ignore) setRowData(sortedRows)
//       } catch (err) {
//         console.error('GET journals failed:', err?.message, err?.response?.status, err?.response?.data)
//         if (!ignore) setErrMsg(err?.response?.data?.message || err?.message || 'Failed to load journals')
//       } finally {
//         if (!ignore) setLoading(false)
//       }
//     }
//     load()
//     return () => {
//       ignore = true
//     }
//   }, [fundId])


//   const dashboard = useDashboardToken()
//   const fmt = dashboard?.date_format || 'MM/DD/YYYY'
  
//   // Fetch fund details to get current decimal_precision
//   useEffect(() => {
//     if (!fundId) {
//       setFundDetails(null)
//       return
//     }
    
//     const fetchFund = async () => {
//       try {
//         const details = await getFundDetails(fundId)
//         setFundDetails(details)
//       } catch (error) {
//         console.error('Failed to fetch fund details:', error)
//         setFundDetails(null)
//       }
//     }
    
//     fetchFund()
//   }, [fundId])
  
//   // Get decimal precision - prioritize fund details from API, then token, then default to 2
//   const decimalPrecision = useMemo(() => {
//     const apiPrecision = fundDetails?.decimal_precision
//     const tokenPrecision = dashboard?.decimal_precision ?? dashboard?.fund?.decimal_precision
//     const precision = apiPrecision ?? tokenPrecision
//     const numPrecision = precision !== null && precision !== undefined ? Number(precision) : null
//     return numPrecision !== null && !isNaN(numPrecision) ? numPrecision : 2
//   }, [fundDetails, dashboard])
  
//   // Get currency symbol from reporting_currency
//   const currencySymbol = useMemo(() => {
//     const reportingCurrency = dashboard?.reporting_currency || dashboard?.fund?.reporting_currency || ''
//     if (!reportingCurrency) return ''
//     const currency = currencies.find((c) => c.code === reportingCurrency)
//     return currency?.symbol || ''
//   }, [dashboard])
  
//   // Optional UX: show a lightweight state until token is ready
//   // define columnDefs here (NOT inside JSX)
//   const columnDefsfordate = useMemo(() => {
//     return (defaultJournalColDefs || []).map((col) => {
//       if (col?.field === 'journal_date') {
//         return {
//           ...col,
//           valueFormatter: (p) => {
//             const raw = p?.value ? String(p.value).slice(0, 10) : ''
//             return formatYmd(raw, fmt) // 'MM/DD/YYYY' or 'DD/MM/YYYY'
//           },
//         }
//       }
      
//       // Format Amount column - use currency symbol at front
//       if (col?.field === 'amount') {
//         return {
//           ...col,
//           valueFormatter: (p) => {
//             const value = p?.value
//             if (value === null || value === undefined || value === '') return '—'
//             const num = Number(value)
//             if (Number.isNaN(num)) return value
//             const formatted = num.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
//             return currencySymbol ? `${currencySymbol}${formatted}` : formatted
//           },
//         }
//       }
      
//       return col
//     })
//   }, [fmt, decimalPrecision, currencySymbol])

//   const fetchData = async () => {
//     if (!fundId) return;
//     try {
//       setLoading(true);
//       const res = await api.get('/api/v1/manualjournal', {
//         params: {
//           fund_id: fundId, page, pageSize,
//           from: from || undefined,
//           to: to || undefined,
//           q: q || undefined,
//         }
//       });
//       setRows(res.data?.data || []);
//       setTotal(res.data?.total || 0);
//     } catch (e) {
//       console.error('fetch manual journals failed:', e);
//       setRows([]); setTotal(0);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Grid ready callback to store grid API reference
//   const onGridReady = useCallback((params) => {
//     gridApiRef.current = params.api
//   }, [])

//   // Export headers for journals
//   const journalExportHeaders = useMemo(
//     () =>
//       (defaultJournalColDefs || [])
//         .filter((col) => col.field)
//         .map((col) => ({ key: col.field, label: col.headerName || col.field })),
//     [defaultJournalColDefs],
//   )

//   // Format export values
//   const formatExportValue = useCallback(
//     (key, value) => {
//       if (key === 'journal_date') {
//         const raw = value ? String(value).slice(0, 10) : ''
//         return raw ? formatYmd(raw, fmt) : ''
//       }
//       if (key === 'amount' && typeof value === 'number') {
//         return value.toLocaleString(undefined, { minimumFractionDigits: decimalPrecision, maximumFractionDigits: decimalPrecision })
//       }
//       return value ?? ''
//     },
//     [fmt, decimalPrecision],
//   )

//   // CSV escape helper
//   const escapeCsv = useCallback((value) => {
//     const stringValue = String(value ?? '')
//     if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
//       return '"' + stringValue.replace(/"/g, '""') + '"'
//     }
//     return stringValue
//   }, [])

//   // Export only filtered rows (rows visible after user filters/searches)
//   // Also respects pagination - only exports rows visible on current page
//   const handleExport = useCallback(
//     (format) => {
//       // Step 1️⃣ - Get filtered rows from current pagination page only
//       let rowsToExport = []

//       if (gridApiRef.current) {
//         // Get pagination info: current page and page size
//         const currentPage = gridApiRef.current.paginationGetCurrentPage() || 0 // page number (0, 1, 2, ...)
//         const pageSize = gridApiRef.current.paginationGetPageSize() || 10 // rows per page (10, 20, etc.)
        
//         // Calculate start and end index for current page
//         const startIndex = currentPage * pageSize // e.g., page 0 = 0, page 1 = 10, page 2 = 20
//         const endIndex = startIndex + pageSize // e.g., 0+10=10, 10+10=20, 20+10=30

//         // Get all filtered rows first
//         const allFilteredRows = []
//         gridApiRef.current.forEachNodeAfterFilterAndSort((node) => {
//           if (node.data) {
//             allFilteredRows.push(node.data)
//           }
//         })

//         // Then get only the rows for current page
//         // e.g., if page 1 (index 0) with page size 10: get rows 0-9
//         // e.g., if page 2 (index 1) with page size 10: get rows 10-19
//         rowsToExport = allFilteredRows.slice(startIndex, endIndex)
//       }
      
//       // If no filtered rows, fall back to all rows from current page
//       if (rowsToExport.length === 0 && rowData.length > 0) {
//         const currentPage = gridApiRef.current?.paginationGetCurrentPage() || 0
//         const pageSize = gridApiRef.current?.paginationGetPageSize() || 10
//         const startIndex = currentPage * pageSize
//         const endIndex = startIndex + pageSize
//         rowsToExport = rowData.slice(startIndex, endIndex)
//       }

//       if (!rowsToExport.length) {
//         alert('No journal records to export. Please check your filters or add some journals.')
//         return
//       }

//       // Step 2️⃣ - Convert to export format using headers and formatter
//       const aoa = buildAoaFromHeaders(journalExportHeaders, rowsToExport, formatExportValue)

//       // Step 3️⃣ - Export based on format
//       const exportDate = new Date().toISOString().slice(0, 10)
//       if (format === 'xlsx') {
//         exportAoaToXlsx({
//           fileName: `journals-filtered-${fundId || 'fund'}-${exportDate}`,
//           sheetName: 'Journals',
//           aoa,
//         })
//         return
//       }

//       // Step 4️⃣ - Create CSV file and download
//       const headerRow = journalExportHeaders.map(({ label }) => escapeCsv(label)).join(',')
//       const dataRows = aoa.map((row) => row.map((cell) => escapeCsv(cell)).join(','))
//       const csvContent = ['\ufeff' + headerRow, ...dataRows].join('\n')
//       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
//       const url = URL.createObjectURL(blob)
//       const link = document.createElement('a')
//       link.href = url
//       link.download = `journals-filtered-${fundId || 'fund'}-${exportDate}.csv`
//       document.body.appendChild(link)
//       link.click()
//       document.body.removeChild(link)
//       URL.revokeObjectURL(url)
//     },
//     [rowData, journalExportHeaders, formatExportValue, escapeCsv, fundId],
//   )
//   return (
//     <Row>
//       <Col xl={12}>
//         <Card>
//           <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
//             <CardTitle as="h4">Journals</CardTitle>
//             <div className="d-flex gap-2">
//               <Button
//                 variant="outline-success"
//                 size="sm"
//                 disabled={!rowData?.length || loading}
//                 onClick={() => handleExport('csv')}
//               >
//                 ExportCSV
//               </Button>
//               <Button
//                 variant="outline-primary"
//                 size="sm"
//                 disabled={!rowData?.length || loading}
//                 onClick={() => handleExport('xlsx')}
//               >
//                 Export XLSX
//               </Button>
//             </div>
//           </CardHeader>
//           <CardBody className="p-2">
//             {errMsg && (
//               <Alert variant="danger" className="mb-2">
//                 {errMsg}
//               </Alert>
//             )}
//             {loading ? (
//               <div className="d-flex align-items-center gap-2 p-3">
//                 <Spinner animation="border" size="sm" /> <span>Loading…</span>
//               </div>
//             ) : (
//               <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
//                 {columnDefs.length > 0 && (
//                   <AgGridReact
//                     onGridReady={onGridReady}
//                     rowData={rowData}
//                     columnDefs={columnDefsfordate}
//                     pagination
//                     paginationPageSize={10}
//                     paginationPageSizeSelector={[10, 25, 50, 100]}
//                     defaultColDef={{ sortable: true, filter: true, resizable: true }}
//                   />
//                 )}
//               </div>
//             )}
//           </CardBody>
//         </Card>
//       </Col>
//     </Row>
//   )
// }

// export default AdminUsersPage
