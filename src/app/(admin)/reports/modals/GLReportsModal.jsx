'use client'

import { useState } from 'react';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { Eye } from 'lucide-react';


// ✅ Register required AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const GLReportsModal = ({ show, handleClose }) => {
  const columnDefs = [
    { headerName: 'Date', field: 'date', sortable: true, filter: true, flex: 1 },
    { headerName: 'Journal ID', field: 'journalid', sortable: true, filter: true, flex: 1 },
    { headerName: 'Account Name', field: 'accountname', sortable: true, filter: true, flex: 1 },
    { headerName: 'Description', field: 'description', sortable: true, filter: true, flex: 1 },
    { headerName: 'Dr Amount', field: 'dramount', sortable: true, filter: true, flex: 1 },
    { headerName: 'Cr Amount', field: 'cramount', sortable: true, filter: true, flex: 1 },
    { headerName: 'Running Balance', field: 'runningbalance', sortable: true, filter: true, flex: 1 },
  ];

  const rowData = [
    { date: '2024-01-31', journalid: 'JL17362641959066344', accountname: 'Stock', description: 'UPNL entry for symbol AAPL on 2024-01-31', dramount: 0.00, cramount: 1101444.01, runningbalance: -1101444.01 },
    { date: '2024-01-31', journalid: 'JL17362641959095898', accountname: 'Stock', description: 'UPNL entry for symbol ADM on 2024-01-31', dramount: 0.00, cramount: 60028.40, runningbalance: -1161472.41 },
    { date: '2024-01-31', journalid: 'JL17362641959114333', accountname: 'Stock', description: 'UPNL entry for symbol ADM on 2024-01-31', dramount: 0.00, cramount: 15070.06, runningbalance: -1176542.47 },
    { date: '2024-01-31', journalid: 'JL17362641959143457', accountname: 'Stock', description: 'UPNL entry for symbol ADM on 2024-01-31', dramount: 0.00, cramount: 240523.00, runningbalance: -1417065.47 },
    { date: '2024-01-31', journalid: 'JL17362641959169738', accountname: 'Stock', description: 'UPNL entry for symbol AFRM on 2024-01-31', dramount: 0.00, cramount: 4342.02, runningbalance: -1421407.49 },
    { date: '2024-01-31', journalid: 'JL17362641959208529', accountname: 'Stock', description: 'UPNL entry for symbol AFRM on 2024-01-31', dramount: 0.00, cramount: 20146.04, runningbalance: -1441553.53 },
    { date: '2024-01-31', journalid: 'JL17362641959226170', accountname: 'Stock', description: 'UPNL entry for symbol AFRM on 2024-01-31', dramount: 0.00, cramount: 24510.12, runningbalance: -1466063.65 },
    { date: '2024-01-31', journalid: 'JL17362641959256253', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 92508.60, runningbalance: -1558572.25 },
    { date: '2024-01-31', journalid: 'JL17362641959282815', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 44475.64, runningbalance: -1603047.89 },
    { date: '2024-01-31', journalid: 'JL17362641959319073', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 121582.01, runningbalance: -1724629.90 },
    { date: '2024-01-31', journalid: 'JL17362641959333796', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 55411.00, runningbalance: -1780040.90 },
    { date: '2024-01-31', journalid: 'JL17362641959362137', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 56024.20, runningbalance: -1836065.10 },
    { date: '2024-01-31', journalid: 'JL17362641959395286', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 66270.05, runningbalance: -1902335.15 },
    { date: '2024-01-31', journalid: 'JL17362641959436140', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 8855.16, runningbalance: -1911190.31 },
    { date: '2024-01-31', journalid: 'JL17362641959454903', accountname: 'Stock', description: 'UPNL entry for symbol AMZN on 2024-01-31', dramount: 0.00, cramount: 30840.03, runningbalance: -1942030.34 },
    { date: '2024-01-31', journalid: 'JL17362641959804910', accountname: 'Stock', description: 'UPNL entry for symbol BA on 2024-01-31', dramount: 0.00, cramount: 793776.47, runningbalance: -2735806.81 },
    { date: '2024-01-31', journalid: 'JL17362641959832708', accountname: 'Stock', description: 'UPNL entry for symbol BA on 2024-01-31', dramount: 0.00, cramount: 520103.56, runningbalance: -3255910.37 },
    { date: '2024-01-31', journalid: 'JL17362641959856965', accountname: 'Stock', description: 'UPNL entry for symbol BA on 2024-01-31', dramount: 0.00, cramount: 1047282.58, runningbalance: -4303192.95 },
    { date: '2024-01-31', journalid: 'JL17362641959896306', accountname: 'Stock', description: 'UPNL entry for symbol BA on 2024-01-31', dramount: 0.00, cramount: 285855.25, runningbalance: -4589048.20 },
    { date: '2024-01-31', journalid: 'JL17362641960793291', accountname: 'Stock', description: 'UPNL entry for symbol BIDU on 2024-01-31', dramount: 0.00, cramount: 507202.98, runningbalance: -5096251.18 }
  ];
  
  

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={20} /> GL Report
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
      <Form className="mb-2">
                    <Row className="mb-6 ">
                    
                      <Col md={6}>
                        <Form.Label>Select Chart Of Accounts</Form.Label>
                        <Form.Control as="select">
                        <option value="11001">11001 - Velocity</option>
                        <option value="11002">11002 - Clear Street</option>
                        <option value="12001">12001 - Morgan Stanley</option>
                        <option value="13110">13110 - Stock</option>
                        <option value="13210">13210 - Stock</option>
                        <option value="14000">14000 - Investment Clearing</option>
                        <option value="21110">21110 - Stock</option>
                        <option value="21210">21210 - Stock</option>
                        <option value="31000">31000 - Opening Equity</option>
                        <option value="32000">32000 - Contribution</option>
                        <option value="33000">33000 - Distribution</option>
                        <option value="34000">34000 - Retained Earning</option>
                        </Form.Control>
                      </Col>
                      <Col md={6}>
                        <Form.Label>Select Category</Form.Label>
                        <Form.Control as="select">
                          <option>MTD</option>
                          <option>QTD</option>
                          <option>YTD</option>
                        </Form.Control>
                      </Col>
                      
                    </Row>
                  </Form>
        {/* ✅ Fix AG Grid Not Showing Inside Modal */}
        <div  style={{ height: 400, width: '100%', minWidth: '900px' }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            rowModelType="clientSide"
            pagination={true}
            paginationPageSize={5}
            //  domLayout="autoHeight"
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default GLReportsModal;
