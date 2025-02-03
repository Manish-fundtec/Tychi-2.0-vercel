'use client'

import { useState, useRef } from 'react';
import { FaPlusSquare, FaMinusSquare } from 'react-icons/fa';
import { AgGridReact } from 'ag-grid-react';
// import 'ag-grid-community/styles/ag-grid.css';
// import { mapData } from '@/assets/tychiData/mappingData';
// import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Accordion, AccordionBody, AccordionHeader, AccordionItem } from 'react-bootstrap';
import { Card, CardBody, CardFooter, CardHeader, CardTitle, Row, Col, Button, Form } from 'react-bootstrap';

const TradesData = () => {
    const gridRef = useRef(null);
  
    // Accordion categories
    const accordionItems = ["Trade", "Basis", "Short Term RPNL", "Long Term RPNL", "UPNL"];
  
    // Column Definitions for Ag-Grid
    const columnDefs = [
      { field: "asset", headerName: "Asset", sortable: true, filter: true, flex: 1 },
      { field: "long", headerName: "Long", sortable: true, filter: true, flex: 1 },
      { field: "short", headerName: "Short", sortable: true, filter: true, flex: 1 },
      { field: "setoff", headerName: "Setoff", sortable: true, filter: true, flex: 1 },
    ];
  
    // Sample Data
    const mapData = [
      { asset: "Stock", long: "Respective Broker Cash", short: "Respective Broker Cash", setoff: "1400-Investment Clearing" },
      { asset: "Stock", long: "Respective Broker Cash", short: "Respective Broker Cash", setoff: "1400-Investment Clearing" },
      { asset: "Stock", long: "Respective Broker Cash", short: "Respective Broker Cash", setoff: "1400-Investment Clearing" },
      { asset: "Stock", long: "Respective Broker Cash", short: "Respective Broker Cash", setoff: "1400-Investment Clearing" },
      { asset: "Stock", long: "Respective Broker Cash", short: "Respective Broker Cash", setoff: "1400-Investment Clearing" },
    ];
  
    return (
      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
              <CardTitle as="h4">Mapping</CardTitle>
            </CardHeader>
            <CardBody>
              <Accordion defaultActiveKey={"0"} id="accordionExample">
                {accordionItems.map((item, idx) => (
                  <AccordionItem eventKey={`${idx}`} key={idx}>
                    <AccordionHeader id={`heading-${idx}`}>
                      <div className="fw-medium">{item}</div>
                    </AccordionHeader>
                    <AccordionBody>
                      {/* <div className="ag-theme-alpine" style={{ width: "100%", height: "300px" }}>
                        <AgGridReact
                          ref={gridRef}
                          columnDefs={columnDefs}
                          rowData={mapData} // Static data (you can filter it based on item if needed)
                        />
                      </div> */}
                      <div>
                  <Form>
                    <Row className="mb-3">
                    <Col md={3}>
                        <Form.Label className="pt-4">Stock (Asset)</Form.Label>
                        {/* <Form.Control as="select">
                          <option>Respective Broker Cash</option>
                        </Form.Control> */}
                      </Col>
                      <Col md={3}>
                        <Form.Label>Stock (Long)</Form.Label>
                        <Form.Control as="select">
                          <option>Respective Broker Cash</option>
                        </Form.Control>
                      </Col>
                      <Col md={3}>
                        <Form.Label>Stock (Short)</Form.Label>
                        <Form.Control as="select">
                          <option>Respective Broker Cash</option>
                        </Form.Control>
                      </Col>
                      <Col md={3}>
                        <Form.Label>Setoff</Form.Label>
                        <Form.Control as="select">
                          <option>14000 - Investment Clearing</option>
                        </Form.Control>
                      </Col>
                    </Row>
                  </Form>
                </div>
                    </AccordionBody>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  };
  
  export default TradesData;