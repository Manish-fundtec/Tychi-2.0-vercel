'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import { AddPermissionModal } from '@/app/(admin)/base-ui/modals/components/AllModals'

// AG Grid (client-side only)
const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  { ssr: false }
)

const PermissionsPage = () => {
  const gridApiRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [rowData, setRowData] = useState([])

  const refreshPermissions = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setRowData([
        { id: 1, name: 'users.view', description: 'View users list', module: 'Users', status: 'Active', createdAt: '2024-01-01' },
        { id: 2, name: 'users.create', description: 'Create new users', module: 'Users', status: 'Active', createdAt: '2024-01-01' },
        { id: 3, name: 'users.edit', description: 'Edit existing users', module: 'Users', status: 'Active', createdAt: '2024-01-01' },
        { id: 4, name: 'users.delete', description: 'Delete users', module: 'Users', status: 'Active', createdAt: '2024-01-01' },
        { id: 5, name: 'funds.view', description: 'View funds list', module: 'Funds', status: 'Active', createdAt: '2024-01-05' },
        { id: 6, name: 'funds.create', description: 'Create new funds', module: 'Funds', status: 'Active', createdAt: '2024-01-05' },
        { id: 7, name: 'trades.view', description: 'View trades', module: 'Trades', status: 'Active', createdAt: '2024-01-10' },
        { id: 8, name: 'trades.create', description: 'Create trades', module: 'Trades', status: 'Active', createdAt: '2024-01-10' },
        { id: 9, name: 'reports.view', description: 'View reports', module: 'Reports', status: 'Active', createdAt: '2024-01-15' },
        { id: 10, name: 'settings.manage', description: 'Manage system settings', module: 'Settings', status: 'Active', createdAt: '2024-01-20' },
      ])
      setLoading(false)
    }, 600)
  }, [])

  // Register AG Grid modules
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('ag-grid-community')
        .then(({ ModuleRegistry, AllCommunityModule }) => {
          ModuleRegistry.registerModules([AllCommunityModule])
        })
        .catch((err) => console.error('Failed to register AG Grid modules:', err))
    }
  }, [])

  // Column Definitions
  const columnDefs = useMemo(
    () => [
      { headerName: 'Sr.No', valueGetter: 'node.rowIndex + 1', width: 80, pinned: 'left' },
      { field: 'name', headerName: 'Permission Key', flex: 1 },
      { field: 'description', headerName: 'Description', flex: 2 },
      { field: 'module', headerName: 'Module', flex: 1 },
      { field: 'status', headerName: 'Status', flex: 1 },
      { field: 'createdAt', headerName: 'Created At', flex: 1 },
    ],
    []
  )

  // Load initial data
  useEffect(() => {
    refreshPermissions()
  }, [refreshPermissions])

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  return (
    <>
      <PageTitle title="Permissions" subName="Admin" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="border-bottom d-flex justify-content-between align-items-center">
              <CardTitle as="h4">Permissions Management</CardTitle>
              <AddPermissionModal onSuccess={refreshPermissions} />
            </CardHeader>

            <CardBody className="p-2">
              {loading ? (
                <div className="d-flex align-items-center gap-2 p-3">
                  <Spinner animation="border" size="sm" />
                  <span>Loading permissions...</span>
                </div>
              ) : (
                <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
                  <AgGridReact
                    onGridReady={onGridReady}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination
                    paginationPageSize={10}
                    paginationPageSizeSelector={[10, 25, 50]}
                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
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

export default PermissionsPage
