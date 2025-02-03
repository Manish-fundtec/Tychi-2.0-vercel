'use client'
import PageTitle from '@/components/PageTitle'
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
  const reortRowData = [
    { srNo: 1, month: 'January', date: '2025-01-01', brokerBank: 'ABC Bank', closingBalance: '$5000' },
    { srNo: 2, month: 'February', date: '2025-02-14', brokerBank: 'XYZ Broker', closingBalance: '$7500' },
  ];
  
  const [rowData] = useState(reortRowData) // Set dummy data as initial state

 

  return (
    <>
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
              <CardTitle as={'h4'}>Reconciliation</CardTitle>
              <Dropdown>
                {/* Dropdown can be added here if needed */}
              </Dropdown>
            </CardHeader>
            <CardBody className="p-2">
              <div
                style={{
                  height: 550,
                  width: '100%',
                }}>
                <AgGridReact
                  rowData={rowData} // Data for rows
                  columnDefs={colmdefs.reconciliation2columnDefs} // Column definitions
                  pagination={true} // Enable pagination
                  paginationPageSize={10} // Set page size
                  defaultColDef={colmdefs.defaultColDef}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default ReviewsPage;
