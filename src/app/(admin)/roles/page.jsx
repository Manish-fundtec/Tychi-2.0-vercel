'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import { AddRoleModal } from '@/app/(admin)/base-ui/modals/components/AllModals'

// AG Grid (client-side only)
const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  { ssr: false }
)

const RolesPage = () => {
  const gridApiRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [rowData, setRowData] = useState([])

  const refreshRoles = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setRowData([
        { id: 1, name: 'Admin', description: 'Full system access', permissions: 15, status: 'Active', createdAt: '2024-01-01' },
        { id: 2, name: 'Manager', description: 'Can manage funds and users', permissions: 10, status: 'Active', createdAt: '2024-01-05' },
        { id: 3, name: 'Viewer', description: 'Read-only access', permissions: 3, status: 'Active', createdAt: '2024-01-10' },
        { id: 4, name: 'Analyst', description: 'Can view and analyze data', permissions: 5, status: 'Active', createdAt: '2024-02-01' },
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
      { field: 'name', headerName: 'Role Name', flex: 1 },
      { field: 'description', headerName: 'Description', flex: 2 },
      { field: 'permissions', headerName: 'Permissions Count', flex: 1 },
      { field: 'status', headerName: 'Status', flex: 1 },
      { field: 'createdAt', headerName: 'Created At', flex: 1 },
    ],
    []
  )

  // Load initial data
  useEffect(() => {
    refreshRoles()
  }, [refreshRoles])

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  return (
    <>
      <PageTitle title="Roles" subName="Admin" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="border-bottom d-flex justify-content-between align-items-center">
              <CardTitle as="h4">Roles Management</CardTitle>
              <AddRoleModal onSuccess={refreshRoles} />
            </CardHeader>

            <CardBody className="p-2">
              {loading ? (
                <div className="d-flex align-items-center gap-2 p-3">
                  <Spinner animation="border" size="sm" />
                  <span>Loading roles...</span>
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

export default RolesPage
