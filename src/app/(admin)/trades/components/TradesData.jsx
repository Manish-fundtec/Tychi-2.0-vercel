'use client';

import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { getAllTrades } from '@/helpers/data';
import { useFetchData } from '@/hooks/useFetchData';
import useToggle from '@/hooks/useToggle';
import Link from 'next/link';
import {BadaModal} from '@/app/(admin)/base-ui/modals/components/AllModals'
import { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import {TradeColDefs} from "@/assets/tychiData/columnDefs"

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);
import { Col, Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row,  } from 'react-bootstrap';
const TradesData = () => {
  const tradesData = useFetchData(getAllTrades);
  const {
    isTrue,
    toggle
  } = useToggle();
 


  return <>
      {/* <BadaModal /> */}
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
              <div>
                <CardTitle as={'h4'}>All Transactions List</CardTitle>
              </div>
              <BadaModal />
            </CardHeader>
            <CardBody className="p-2">
            <div
              // define a height because the Data Grid will fill the size of the parent container
              style={{
                height: '100%', // Take the full height of the parent container
                width: '100%',  // Take the full width of the parent container
              }}>
              <AgGridReact
                      rowData={tradesData}
                      columnDefs={TradeColDefs}
                      pagination={true} // Enable pagination
                      paginationPageSize={10} // Set page size
                      defaultColDef={{
                        sortable: true,
                        filter: true,
                        resizable: true, // Allow resizing
                      }}
                      domLayout="autoHeight" // Automatically adjust height
              />
            </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
     
    </>;
    
};
export default TradesData;
