'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import { AddOrganizationModal } from '@/app/(admin)/base-ui/modals/components/AllModals'

// AG Grid (client-side only)
const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  { ssr: false }
)

const OrganizationsPage = () => {
  const gridApiRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [rowData, setRowData] = useState([])

  const refreshOrganizations = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setRowData([
        { id: 1, name: 'FundTec Capital', email: 'admin@fundtec.in', phone: '+1-555-0100', address: 'New York, USA', status: 'Active', createdAt: '2024-01-01' },
        { id: 2, name: 'Alpha Investments', email: 'info@alpha.com', phone: '+1-555-0200', address: 'San Francisco, USA', status: 'Active', createdAt: '2024-02-01' },
        { id: 3, name: 'Beta Holdings', email: 'contact@beta.io', phone: '+1-555-0300', address: 'Chicago, USA', status: 'Active', createdAt: '2024-03-01' },
        { id: 4, name: 'Gamma Partners', email: 'hello@gamma.co', phone: '+1-555-0400', address: 'Boston, USA', status: 'Inactive', createdAt: '2024-04-01' },
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
      { field: 'name', headerName: 'Organization Name', flex: 1 },
      { field: 'email', headerName: 'Email', flex: 1 },
      { field: 'phone', headerName: 'Phone', flex: 1 },
      { field: 'address', headerName: 'Address', flex: 1 },
      { field: 'status', headerName: 'Status', flex: 1 },
      { field: 'createdAt', headerName: 'Created At', flex: 1 },
    ],
    []
  )

  // Load initial data
  useEffect(() => {
    refreshOrganizations()
  }, [refreshOrganizations])

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  return (
    <>
      <PageTitle title="Organizations" subName="Admin" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="border-bottom d-flex justify-content-between align-items-center">
              <CardTitle as="h4">Organizations Management</CardTitle>
              <AddOrganizationModal onSuccess={refreshOrganizations} />
            </CardHeader>

            <CardBody className="p-2">
              {loading ? (
                <div className="d-flex align-items-center gap-2 p-3">
                  <Spinner animation="border" size="sm" />
                  <span>Loading organizations...</span>
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

export default OrganizationsPage
