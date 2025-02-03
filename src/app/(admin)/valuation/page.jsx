'use client' // ✅ Ensures this is a Client Component

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import colmdefs from '@/assets/tychiData/columnDefs'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  Dropdown,
  Row,
} from 'react-bootstrap'

// ✅ Dynamically Import AgGridReact (Prevents SSR Issues)
const AgGridReact = dynamic(() => import('ag-grid-react').then(mod => mod.AgGridReact), {
  ssr: false, // ✅ Ensures it only runs on client-side
})

ModuleRegistry.registerModules([AllCommunityModule])

const ValuationPage = () => {
  const [rowData, setRowData] = useState([])
  const [columnDefs, setColumnDefs] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined') { // ✅ Ensures code runs only in the browser
      setRowData([
        { srNo: 1, month: 'January', date: '2025-01-01', status: 'Pending' },
        { srNo: 2, month: 'February', date: '2025-02-14', status: 'Completed' },
      ])
      setColumnDefs(colmdefs.pricingColDefs)
    }
  }, [])

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Valuation</CardTitle>
            <Dropdown>
              {/* Replace with your modal component */}
            </Dropdown>
          </CardHeader>
          <CardBody className="p-2">
            <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
              {columnDefs.length > 0 && (
                <AgGridReact
                  rowData={rowData}
                  columnDefs={columnDefs}
                  pagination={true}
                  paginationPageSize={10}
                  defaultColDef={colmdefs.defaultColDef}
                />
              )}
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default ValuationPage
