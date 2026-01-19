'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Button, FormSelect, FormGroup, FormLabel } from 'react-bootstrap'
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
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [rowData, setRowData] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState('')

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrgs(true)
      try {
        const response = await api.get('/api/v1/organization')
        const data = response.data?.data || response.data || []
        setOrganizations(data)
        // Auto-select first organization if available
        if (data.length > 0) {
          const firstOrgId = data[0].organization_id || data[0].id
          setSelectedOrgId(firstOrgId)
        }
      } catch (error) {
        console.error('Error fetching organizations:', error)
      } finally {
        setLoadingOrgs(false)
      }
    }
    fetchOrganizations()
  }, [])

  const refreshRoles = useCallback(async () => {
    if (!selectedOrgId) {
      setRowData([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/api/v1/roles/org/${selectedOrgId}/with-permissions`)
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
  }, [selectedOrgId])

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
    if (selectedOrgId) {
      refreshRoles()
    }
  }, [selectedOrgId, refreshRoles])

  const handleOrgChange = (e) => {
    setSelectedOrgId(e.target.value)
  }

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
              {/* Organization Filter */}
              <Row className="mb-3">
                <Col md={4}>
                  <FormGroup>
                    <FormLabel>Select Organization</FormLabel>
                    {loadingOrgs ? (
                      <div className="d-flex align-items-center gap-2">
                        <Spinner animation="border" size="sm" />
                        <span>Loading organizations...</span>
                      </div>
                    ) : (
                      <FormSelect
                        value={selectedOrgId}
                        onChange={handleOrgChange}
                      >
                        <option value="">Select Organization</option>
                        {organizations.map((org) => (
                          <option key={org.organization_id || org.id} value={org.organization_id || org.id}>
                            {org.organization_name || org.name}
                          </option>
                        ))}
                      </FormSelect>
                    )}
                  </FormGroup>
                </Col>
              </Row>
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
