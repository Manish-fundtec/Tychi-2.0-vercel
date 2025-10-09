import { BasicForm } from "@/app/(admin)/forms/validation/components/ConfigurationForm";
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { BrokerModal, SymbolModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
import { GLEntryModal } from '@/app/(admin)/base-ui/modals/components/AllModals'
import { BankModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
import { ExchangeModal } from '@/app/(admin)/base-ui/modals/components/ConfigurationModal'
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Accordion, AccordionBody, AccordionHeader, AccordionItem } from 'react-bootstrap';
import { BrokerageTableColDefs , assetTypeColDefs, symbolColDefs} from "@/assets/tychiData/columnDefs"
// Fallback empty col defs for demos if not exported from columnDefs
const bankTableColDefs = []
const exchangeTableColDefs = []
import TradesData from '@/app/(admin)/mapping/component/mapData';
// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);
import { Col, Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row, } from 'react-bootstrap';
const BrokerageData = [
  {
    SrNo: 1,
    UID: 'UID12345',
    Name: 'John Doe',
    StartDate: '2023-01-01',
    Action: 'Edit',
  },
  {
    SrNo: 2,
    UID: 'UID67890',
    Name: 'Jane Smith',
    StartDate: '2023-06-15',
    Action: 'Edit',
  },
  {
    SrNo: 3,
    UID: 'UID54321',
    Name: 'Alice Brown',
    StartDate: '2023-11-23',
    Action: 'Edit',
  },
];
const bankTableRowData = [
  {
    Sno: 1,
    UID: 'UID101',
    BankID: 'BID001',
    BankName: 'First National Bank',
    StartDate: '2023-02-01',
    Action: 'Edit',
  },
  {
    Sno: 2,
    UID: 'UID102',
    BankID: 'BID002',
    BankName: 'Central Trust Bank',
    StartDate: '2023-03-15',
    Action: 'Edit',
  },
  {
    Sno: 3,
    UID: 'UID103',
    BankID: 'BID003',
    BankName: 'Community Credit Union',
    StartDate: '2023-06-25',
    Action: 'Edit',
  },
];
const exchangeTableData = [
  { Sno: 1, UID: 'UID001', ExchangeID: 'EX001', ExchangeName: 'Exchange Alpha', Action: 'View' },
  { Sno: 2, UID: 'UID002', ExchangeID: 'EX002', ExchangeName: 'Exchange Beta', Action: 'Edit' },
  { Sno: 3, UID: 'UID003', ExchangeID: 'EX003', ExchangeName: 'Exchange Gamma', Action: 'Delete' },
  { Sno: 4, UID: 'UID004', ExchangeID: 'EX004', ExchangeName: 'Exchange Delta', Action: 'View' },
  { Sno: 5, UID: 'UID005', ExchangeID: 'EX005', ExchangeName: 'Exchange Epsilon', Action: 'Edit' }
];
export const assetTypeData = [
  { Sno: 1, UID: 'AST17362439140662216', Name: 'Stock', LongTermRule: '1 Year', CloserRule: 'FIFO', Status: '' },
  { Sno: 2, UID: 'AST17362439140719180', Name: 'Futures', LongTermRule: '-', CloserRule: '-', Status: '' },
  { Sno: 3, UID: 'AST17362439140776428', Name: 'Options', LongTermRule: '-', CloserRule: '-', Status: '' },
  { Sno: 4, UID: 'AST17362439140835273', Name: 'Bonds', LongTermRule: '-', CloserRule: '-', Status: '' },
  { Sno: 5, UID: 'AST17362439140885788', Name: 'Master Funds', LongTermRule: '-', CloserRule: '-', Status: '' },
  { Sno: 6, UID: 'AST17362439140937553', Name: 'Partnerships', LongTermRule: '-', CloserRule: '-', Status: '' },
  { Sno: 7, UID: 'AST17362439140982698', Name: 'Digital Asset', LongTermRule: '-', CloserRule: '-', Status: '' },
  { Sno: 8, UID: 'AST17362439141045171', Name: 'Other', LongTermRule: '-', CloserRule: '-', Status: '' }
];
export const symbolData = [
  { Sno: 1, UID: 'UID001', SymbolID: 'SYM001', SymbolName: 'Apple Inc.', ISIN: 'US0378331005', CUSIP: '037833100', AssetType: 'Stock', Exchange: 'NASDAQ', ContractSize: 1, Action: 'Edit' },
  { Sno: 2, UID: 'UID002', SymbolID: 'SYM002', SymbolName: 'Microsoft Corp.', ISIN: 'US5949181045', CUSIP: '594918104', AssetType: 'Stock', Exchange: 'NASDAQ', ContractSize: 1, Action: 'Edit' },
  { Sno: 3, UID: 'UID003', SymbolID: 'SYM003', SymbolName: 'Amazon.com', ISIN: 'US0231351067', CUSIP: '023135106', AssetType: 'Stock', Exchange: 'NASDAQ', ContractSize: 1, Action: 'Edit' },
  { Sno: 4, UID: 'UID004', SymbolID: 'SYM004', SymbolName: 'Tesla Inc.', ISIN: 'US88160R1014', CUSIP: '88160R101', AssetType: 'Stock', Exchange: 'NASDAQ', ContractSize: 1, Action: 'Edit' },
  { Sno: 5, UID: 'UID005', SymbolID: 'SYM005', SymbolName: 'Alphabet Inc.', ISIN: 'US02079K3059', CUSIP: '02079K305', AssetType: 'Stock', Exchange: 'NASDAQ', ContractSize: 1, Action: 'Edit' }
];
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
     


export const tabContents = [{
  id: '1',
  title: 'Basic',
  description: <BasicForm />,
  icon: 'bx:home'
}, {
  id: '2',
  title: 'Brokerage Account',
  description:
    (<Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <div>
              <CardTitle as={'h4'}>Brokerage List</CardTitle>
            </div>
            <Dropdown>
              <BrokerModal />
            </Dropdown>
          </CardHeader>
          <CardBody className="p-2">
            <div
              // define a height because the Data Grid will fill the size of the parent container
               style={{
                height: '100%', // Take the full height of the parent container
                width: '100%',  // Take the full width of the parent container
              }}>
              <AgGridReact
                      rowData={BrokerageData}
                      columnDefs={BrokerageTableColDefs}
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
    ),
  icon: 'bx:user'
}, {
  id: '3',
  title: 'Bank',
  description: (<Row>
    <Col xl={12}>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
          <div>
            <CardTitle as={'h4'}>Bank List</CardTitle>
          </div>
          <Dropdown>
            <BankModal />
          </Dropdown>
        </CardHeader>
        <CardBody className="p-2">
            <div
              // define a height because the Data Grid will fill the size of the parent container
               style={{
                height: '100%', // Take the full height of the parent container
                width: '100%',  // Take the full width of the parent container
              }}>
              <AgGridReact
                rowData={bankTableRowData}
                columnDefs={bankTableColDefs}
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
  ),
  icon: 'bx:user'
}, {
  id: '4',
  title: 'Exchange',
  description:
    (<Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <div>
              <CardTitle as={'h4'}>Exhange List</CardTitle>
            </div>
            <Dropdown>
              <ExchangeModal />
            </Dropdown>
          </CardHeader>
          <CardBody className="p-2">
            <div
              // define a height because the Data Grid will fill the size of the parent container
               style={{
                height: '100%', // Take the full height of the parent container
                width: '100%',  // Take the full width of the parent container
              }}>
              <AgGridReact
                rowData={exchangeTableData}
                columnDefs={exchangeTableColDefs}
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
    ),
  icon: 'bx:user'
}, {
  id: '5',
  title: 'Asset Type',
  description: (<Row>
    <Col xl={12}>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
          <div>
            <CardTitle as={'h4'}>Assettype List</CardTitle>
          </div>
          {/* <Dropdown>
            <ExchangeModal />
          </Dropdown> */}
        </CardHeader>
        <CardBody className="p-2">
            <div
              // define a height because the Data Grid will fill the size of the parent container
               style={{
                height: '100%', // Take the full height of the parent container
                width: '100%',  // Take the full width of the parent container
              }}>
              <AgGridReact
                rowData={assetTypeData}
                columnDefs={assetTypeColDefs}
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
  ),
  icon: 'bx:user'
}, {
  id: '6',
  title: 'Symbol',
  description: (<Row>
    <Col xl={12}>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
          <div>
            <CardTitle as={'h4'}>Bank List</CardTitle>
          </div>
          <Dropdown>
            <SymbolModal />
          </Dropdown>
        </CardHeader>
        <CardBody className="p-2">
            <div
              // define a height because the Data Grid will fill the size of the parent container
               style={{
                height: '100%', // Take the full height of the parent container
                width: '100%',  // Take the full width of the parent container
              }}>
              <AgGridReact
                rowData={symbolData}
                columnDefs={symbolColDefs}
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
  ),
  icon: 'bx:user'
},
{
  id: '7',
  title: 'Mapping',
  description: (
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
                    <div
                      // define a height because the Data Grid will fill the size of the parent container
                      style={{
                        height: '100%', // Take the full height of the parent container
                        width: '100%',  // Take the full width of the parent container
                      }}>
                      <AgGridReact
                        rowData={mapData}
                        columnDefs={columnDefs}
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
                  </AccordionBody>
                </AccordionItem>
              ))}
            </Accordion>
          </CardBody>
        </Card>
      </Col>
    </Row>
  ),
  icon: 'bx:user'

}];