'use client'
import PageTitle from '@/components/PageTitle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { getAllReview } from '@/helpers/data'
import Image from 'next/image'
import Link from 'next/link'
import { AgGridReact } from 'ag-grid-react'
import { MGLEntryModal } from '../base-ui/modals/components/AllModals'
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
    {
      Id: 1,
      "Journal Id": "JL17360974611593170",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "42000 - Unrealized P&L",
      "Amount": "$ 9,27,615.74",
     
    },
    {
      Id: 2,
      "Journal Id": "JL17360974611589200",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "34000 - Retained Earning",
      "Amount": "$ 3,52,43,408.55",
     
    },
    {
     Id: 3,
      "Journal Id": "JL17360974611576640",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "35000 - Capital",
      "Amount": "$ -1,11,384.71",
     
    },
    {
     Id: 4,
      "Journal Id": "JL17360974611565821",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "22000 - Management Fee Payable",
      "Amount": "$ 28,826.8",
     
    },
    {
     Id: 5,
      "Journal Id": "JL17360974611557159",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "21900 - Withdrawal/Redemption",
      "Amount": "$ 1,30,08,303.18",
     
    },
    {
     Id: 6,
      "Journal Id": "JL17360974611548459",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "21800 - Due to Related Party",
      "Amount": "$ 31,926.69",
     
    },
    {
     Id: 7,
      "Journal Id": "JL17360974611535703",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "21730 - Government Fee Payable",
      "Amount": "$ 731.74",
     
    },
    {
     Id: 8,
      "Journal Id": "JL17360974611524862",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "21720 - Hosting and Network Fees Payable",
      "Amount": "$ 41,804.09",
     
    },
    {
     Id: 9,
      "Journal Id": "JL17360974611503973",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "21710 - Market Data Fees Payable",
      "Amount": "$ 44,208.85",
     
    },
    {
     Id: 10,
      "Journal Id": "JL17360974611492300",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "21600 - Broker Payable",
      "Amount": "$ 40,000",
      
    },
    {
     Id: 11,
      "Journal Id": "JL17360974611488557",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "21500 - Audit Fee Payable",
      "Amount": "$ 60,000",
     
    },
    {
     Id: 12,
      "Journal Id": "JL17360974611479782",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "21400 - Administration Fee Payable",
      "Amount": "$ 3,500",
    
    },
    {
     Id: 13,
      "Journal Id": "JL17360974611469763",
      "Date": "2023-12-31",
      "Debit Account": "31000 - Opening Equity",
      "Credit Account": "21300 - Accounting Fee Payable",
      "Amount": "$ 2,499.85",
    
    },
    {
     Id: 14,
      "Journal Id": "JL17360974611458971",
      "Date": "2023-12-31",
      "Debit Account": "16200 - Management Fee Receivable",
      "Credit Account": "31000 - Opening Equity",
      "Amount": "$ 28,826.8",
     
    },
    {
     Id: 15,
      "Journal Id": "JL17360974611446433",
      "Date": "2023-12-31",
      "Debit Account": "16100 - Prepaid Assets",
      "Credit Account": "31000 - Opening Equity",
      "Amount": "$ 21,996.64",
     
    },
  ];
  
  const [rowData] = useState(dummyRowData) // Set dummy data as initial state


  
  return (
    <>
      {/* Button to trigger the modal */}
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
              <CardTitle as={'h4'}>Manual Journal</CardTitle>
              <Dropdown>
                <MGLEntryModal />
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
                  columnDefs={colmdefs.manualJournalColDefs} // Column definitions
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
