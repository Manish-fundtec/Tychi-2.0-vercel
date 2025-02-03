'use client' // ✅ Ensures this is a Client Component

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Dropdown } from 'react-bootstrap'
import { MGLEntryModal } from '../base-ui/modals/components/AllModals'
import colmdefs from '@/assets/tychiData/columnDefs'

// ✅ Ensure AgGridReact is dynamically imported to prevent SSR issues
const AgGridReact = dynamic(() => import('ag-grid-react').then(mod => mod.AgGridReact), {
  ssr: false, // ✅ Disables SSR for this component
})

ModuleRegistry.registerModules([AllCommunityModule])

const ManualJournalPage = () => {
  const [rowData, setRowData] = useState([])
  const [columnDefs, setColumnDefs] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined') { // ✅ Prevents SSR issues
      setRowData([
        { srNo: 1, month: 'January', date: '2025-01-01', status: 'Pending' },
        { srNo: 2, month: 'February', date: '2025-02-14', status: 'Completed' },
      ])
      setColumnDefs(colmdefs.manualJournalColDefs)
    }
  }, [])

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Manual Journal</CardTitle>
            <Dropdown>
              <MGLEntryModal />
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

export default ManualJournalPage
