'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Button } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import api from '@/lib/api/axios'

const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  { ssr: false }
)

const RolesPage = () => {
  const router = useRouter()
  const gridApiRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [rowData, setRowData] = useState([])

  const refreshRoles = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/roles/with-permissions')
      const data = response.data?.data || response.data || []
      const mapped = data.map(role => ({
        id: role.role_id,
        name: role.role_name,
        tag: role.role_tag,
        description: role.role_description,
        status: role.status,
        createdAt: role.create_date_time,
        permissions: role.permissions || [],
        funds: role.funds || [],
      }))
      setRowData(mapped)
    } catch (error) {
      console.error('Error fetching roles:', error)
      setRowData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('ag-grid-community')
        .then(({ ModuleRegistry, AllCommunityModule }) => {
          ModuleRegistry.registerModules([AllCommunityModule])
        })
        .catch((err) => console.error('Failed to register AG Grid modules:', err))
    }
  }, [])

  const columnDefs = useMemo(
    () => [
      { headerName: 'Sr.No', valueGetter: 'node.rowIndex + 1', width: 80, pinned: 'left' },
      { field: 'name', headerName: 'Role Name', flex: 1 },
      { field: 'tag', headerName: 'Tag', flex: 1 },
      { field: 'description', headerName: 'Description', flex: 1 },
      { field: 'status', headerName: 'Status', flex: 1 },
      { field: 'createdAt', headerName: 'Created At', flex: 1 },
    ],
    []
  )

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
              <Button variant="primary" onClick={() => router.push('/roles/add')}>
                Add Role
              </Button>
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
