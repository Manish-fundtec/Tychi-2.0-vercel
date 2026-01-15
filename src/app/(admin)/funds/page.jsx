'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Badge } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'

// AG Grid (client-side only)
const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  { ssr: false }
)

// Status Toggle Cell Renderer
const StatusToggleRenderer = ({ value, data, onStatusChange }) => {
  const isActive = value === 'Active'
  
  const handleToggle = () => {
    const newStatus = isActive ? 'Inactive' : 'Active'
    if (onStatusChange) {
      onStatusChange(data.id, newStatus)
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

  const refreshFunds = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setRowData([
        { id: 1, name: 'Alpha Growth Fund', organization: 'FundTec Capital', aum: '$25M', currency: 'USD', fundType: 'Hedge Fund', status: 'Active', createdAt: '2024-01-01' },
        { id: 2, name: 'Beta Value Fund', organization: 'Alpha Investments', aum: '$50M', currency: 'USD', fundType: 'Mutual Fund', status: 'Active', createdAt: '2024-02-01' },
        { id: 3, name: 'Gamma Income Fund', organization: 'Beta Holdings', aum: '$15M', currency: 'EUR', fundType: 'Fixed Income', status: 'Inactive', createdAt: '2024-03-01' },
        { id: 4, name: 'Delta Equity Fund', organization: 'Gamma Partners', aum: '$100M', currency: 'USD', fundType: 'Equity Fund', status: 'Active', createdAt: '2024-04-01' },
        { id: 5, name: 'Epsilon Balanced Fund', organization: 'FundTec Capital', aum: '$30M', currency: 'GBP', fundType: 'Balanced Fund', status: 'Inactive', createdAt: '2024-05-01' },
      ])
      setLoading(false)
    }, 600)
  }, [])

  // Handle status toggle
  const handleStatusChange = useCallback((id, newStatus) => {
    setRowData(prev => prev.map(row => 
      row.id === id ? { ...row, status: newStatus } : row
    ))
    // TODO: API call to update status
    console.log(`Fund ${id} status changed to ${newStatus}`)
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
      { field: 'name', headerName: 'Fund Name', flex: 1 },
      { field: 'organization', headerName: 'Organization', flex: 1 },
      { field: 'aum', headerName: 'AUM', flex: 1 },
      { field: 'currency', headerName: 'Currency', width: 100 },
      { field: 'fundType', headerName: 'Fund Type', flex: 1 },
      { 
        field: 'status', 
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
      { field: 'createdAt', headerName: 'Created At', flex: 1 },
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
