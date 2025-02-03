'use client' // ✅ Ensure this is a client component

import dynamic from 'next/dynamic' // ✅ Fix "window is not defined"
import PageTitle from '@/components/PageTitle'
import { ToggleBetweenModals } from '@/app/(admin)/base-ui/modals/components/AllModals';
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { getAllReview } from '@/helpers/data'
import Image from 'next/image'
import Link from 'next/link'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { useState } from 'react'
import colmdefs from '@/assets/tychiData/columnDefs'; 
ModuleRegistry.registerModules([AllCommunityModule])
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Col,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  Modal,
} from 'react-bootstrap'


const ReviewsPage = () => {
  // Dummy data for rows
  const dummyRowData = [
    { srNo: 1, month: 'January', date: '2025-01-01', status: 'Pending' },
  { srNo: 2, month: 'February', date: '2025-02-14', status: 'Completed' },
  ];
  const [rowData] = useState(dummyRowData) // Set dummy data as initial state

  return (
    <>
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
              <CardTitle as={'h4'}>Valuation</CardTitle>
              <Dropdown>
              <ToggleBetweenModals />
              </Dropdown>
            </CardHeader>
            <CardBody className="p-2">
              <div
                className="ag-theme-alpine"
                style={{
                  height: 550,
                  width: '100%',
                }}>
                <AgGridReact
                  rowData={rowData} // Data for rows
                  columnDefs={colmdefs.pricingColDefs} // Column definitions
                  pagination={true} // Enable pagination
                  paginationPageSize={10} // Set page size
                  defaultColDef={
                    colmdefs.defaultColDef
                  }
                />
              </div>
            </CardBody>
           
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default ReviewsPage
