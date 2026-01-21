'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Button } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import api from '@/lib/api/axios'
import { useNotificationContext } from '@/context/useNotificationContext'

const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  { ssr: false }
)

const RolesPage = () => {
  const router = useRouter()
  const gridApiRef = useRef(null)
  const { showNotification } = useNotificationContext()

  const [loading, setLoading] = useState(true)
  const [rowData, setRowData] = useState([])
  const [deleting, setDeleting] = useState(false)

  const refreshRoles = useCallback(async () => {
    setLoading(true)
    try {
      // First, try to get all organizations
      const orgsResponse = await api.get('/api/v1/organization')
      const organizations = orgsResponse.data?.data || orgsResponse.data || []
      
      if (organizations.length === 0) {
        setRowData([])
        setLoading(false)
        return
      }

      // Fetch roles for all organizations and combine them
      const allRolesPromises = organizations.map(async (org) => {
        try {
          const orgId = org.organization_id || org.id
          const response = await api.get(`/api/v1/roles/org/${orgId}/with-permissions`)
          const data = response.data?.data || response.data || []
          return Array.isArray(data) ? data : []
        } catch (error) {
          console.error(`Error fetching roles for org ${org.organization_id || org.id}:`, error)
          return []
        }
      })

      const allRolesArrays = await Promise.all(allRolesPromises)
      const allRoles = allRolesArrays.flat()
      
      // Remove duplicates based on role_id
      const uniqueRolesMap = new Map()
      allRoles.forEach(role => {
        const roleId = role.role_id || role.id
        if (roleId && !uniqueRolesMap.has(roleId)) {
          uniqueRolesMap.set(roleId, role)
        }
      })
      
      const data = Array.from(uniqueRolesMap.values())
      
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
      console.error('Error response:', error?.response?.data)
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
      {
        headerName: 'Actions',
        width: 150,
        pinned: 'right',
        sortable: false,
        filter: false,
        cellRenderer: (params) => {
          const roleId = params.data?.id
          const roleName = params.data?.name || 'Role'
          
          return (
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit(roleId)
                }}
                disabled={deleting}
              >
                Edit
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(roleId, roleName)
                }}
                disabled={deleting}
              >
                Delete
              </Button>
            </div>
          )
        },
      },
    ],
    [handleEdit, handleDelete, deleting]
  )

  useEffect(() => {
    refreshRoles()
  }, [refreshRoles])

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  // Handle Edit Role
  const handleEdit = useCallback((roleId) => {
    router.push(`/roles/edit/${roleId}`)
  }, [router])

  // Handle Delete Role
  const handleDelete = useCallback(async (roleId, roleName) => {
    if (!window.confirm(`Are you sure you want to delete role "${roleName}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      // Try to delete role - adjust endpoint based on your API
      await api.delete(`/api/v1/roles/${roleId}`)
      
      showNotification({
        message: `Role "${roleName}" deleted successfully`,
        variant: 'success',
      })
      
      // Refresh roles list
      refreshRoles()
    } catch (error) {
      console.error('Error deleting role:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete role'
      showNotification({
        message: errorMessage,
        variant: 'danger',
      })
    } finally {
      setDeleting(false)
    }
  }, [refreshRoles, showNotification])

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
