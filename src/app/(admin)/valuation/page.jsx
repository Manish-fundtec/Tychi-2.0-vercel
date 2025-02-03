'use client' // ✅ Ensures this is a client-side component

// import dynamic from 'next/dynamic' // ✅ Fix "window is not defined"
import { useEffect, useState } from 'react'
// import { ToggleBetweenModals } from '@/app/(admin)/base-ui/modals/components/AllModals'
import colmdefs from '@/assets/tychiData/columnDefs'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  Dropdown,
  Row,
} from 'react-bootstrap'

// ✅ Register Ag-Grid Modules
ModuleRegistry.registerModules([AllCommunityModule])

// ✅ Dynamically Import AgGridReact to Prevent SSR Issues
const AgGridReact = dynamic(() => import('ag-grid-react').then(mod => mod.AgGridReact), {
  ssr: false, // ✅ Ensures it only loads on the client-side
})
const ToggleBetweenModals = dynamic(
  () => import('@/app/(admin)/base-ui/modals/components/AllModals').then((mod) => mod.ToggleBetweenModals),
  { ssr: false } // ✅ Ensures it only loads on the client-side
);

export const dynamic = "force-dynamic"; // ✅ Prevents Next.js from trying to statically export


const ReviewsPage = () => {
  // ✅ Dummy data for rows
  const dummyRowData = [
    { srNo: 1, month: 'January', date: '2025-01-01', status: 'Pending' },
    { srNo: 2, month: 'February', date: '2025-02-14', status: 'Completed' },
  ]

  const [rowData, setRowData] = useState([])
  const [columnDefs, setColumnDefs] = useState([])

  // ✅ Load Data on Client-Side to Prevent SSR Issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      setColumnDefs(colmdefs.pricingColDefs);
    }
  }, []);

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Valuation</CardTitle>
            <Dropdown>
              <ToggleBetweenModals />
            </Dropdown>
          </CardHeader>
          <CardBody className="p-2">
            <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
              {/* ✅ Ensure AgGrid only renders when columnDefs are ready */}
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

export default ReviewsPage

