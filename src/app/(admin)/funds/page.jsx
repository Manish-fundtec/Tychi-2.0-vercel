'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Badge } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import { getAllFundsAdmin } from '@/lib/api/fund'

// AG Grid (client-side only)
const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  { ssr: false }
)

// Status Toggle Cell Renderer
const StatusToggleRenderer = ({ value, data, onStatusChange }) => {
  const isActive = value === 'Active' || value === 'active'
  
  const handleToggle = () => {
    const newStatus = isActive ? 'Inactive' : 'Active'
    if (onStatusChange) {
      onStatusChange(data.fund_id, newStatus)
    }
  }

  return (
    <div className="form-check form-switch d-flex align-items-center gap-2">
      <input
        className="form-check-input"
        type="checkbox"
        checked={isActive}
        onChange={handleToggle}
        style={{ cursor: 'pointer', width: '40px', height: '20px' }}
      />
      <Badge bg={isActive ? 'success' : 'secondary'}>
        {value}
      </Badge>
    </div>
  )
}

const FundsPage = () => {
  const gridApiRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [rowData, setRowData] = useState([])

  const refreshFunds = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllFundsAdmin()
      // Backend returns { funds: [...], total: number }
      const fundsList = data?.funds || data || []
      setRowData(fundsList)
    } catch (error) {
      console.error('Error fetching funds:', error)
      setRowData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle status toggle
  const handleStatusChange = useCallback((fundId, newStatus) => {
    setRowData(prev => prev.map(row => 
      row.fund_id === fundId ? { ...row, fund_status: newStatus } : row
    ))
    // TODO: API call to update status
    console.log(`Fund ${fundId} status changed to ${newStatus}`)
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
      { field: 'fund_id', headerName: 'Fund ID', flex: 1 },
      { field: 'fund_name', headerName: 'Fund Name', flex: 1 },
      { 
        field: 'organization', 
        headerName: 'Organization', 
        flex: 1,
        valueGetter: (params) => {
          // Handle nested organization object from backend
          if (params.data?.organization?.org_name) {
            return params.data.organization.org_name
          }
          if (params.data?.organization_name) {
            return params.data.organization_name
          }
          return 'N/A'
        }
      },
      { 
        field: 'fund_status', 
        headerName: 'Status', 
        flex: 1,
        cellRenderer: (params) => (
          <StatusToggleRenderer 
            value={params.value} 
            data={params.data} 
            onStatusChange={handleStatusChange}
          />
        )
      },
    ],
    [handleStatusChange]
  )

  // Load initial data
  useEffect(() => {
    refreshFunds()
  }, [refreshFunds])

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api
  }, [])

  return (
    <>
      <PageTitle title="Funds" subName="Admin" />
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="border-bottom">
              <CardTitle as="h4">Funds Management</CardTitle>
            </CardHeader>

            <CardBody className="p-2">
              {loading ? (
                <div className="d-flex align-items-center gap-2 p-3">
                  <Spinner animation="border" size="sm" />
                  <span>Loading funds...</span>
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

export default FundsPage
