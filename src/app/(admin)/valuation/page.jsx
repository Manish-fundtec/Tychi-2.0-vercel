'use client'; // ✅ Ensures this is a Client Component

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Modal, Row, Button } from 'react-bootstrap';
import { Eye } from 'lucide-react';

// ✅ Dynamically import ToggleBetweenModals to avoid SSR issues
const ToggleBetweenModals = dynamic(() => 
  import('@/app/(admin)/base-ui/modals/components/AllModals').then(mod => mod.ToggleBetweenModals), 
  { ssr: false }
);

// ✅ Dynamically import AgGridReact to prevent SSR issues
const AgGridReact = dynamic(() => 
  import('ag-grid-react').then(mod => mod.AgGridReact), 
  { ssr: false }
);

const ReviewsPage = () => {
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [symbolData, setSymbolData] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // ✅ Dynamically import column definitions safely
      import('@/assets/tychiData/columnDefs')
        .then((colmdefs) => {
          setColumnDefs([
            ...colmdefs.pricingColDefs,
            {
              headerName: 'View Symbols',
              field: 'status',
              cellRenderer: (params) =>
                params.value === 'Completed' ? (
                  <Eye
                    size={18}
                    className="text-primary cursor-pointer"
                    onClick={() => handleViewSymbols(params.data.month)}
                    title="View Symbols"
                  />
                ) : (
                  '—'
                ),
              width: 80,
              sortable: false,
              filter: false,
            },
          ]);
        })
        .catch((error) => {
          console.error('Error loading columnDefs:', error);
          setColumnDefs([]);
        });

      // ✅ Set row data
      setRowData([
        { srNo: 1, month: 'January', date: '2025-01-31', status: 'Completed' },
        { srNo: 2, month: 'February', date: '2025-02-28', status: 'Completed' },
        { srNo: 3, month: 'March', date: '2025-03-31', status: 'Completed' },
      ]);

      // ✅ Set Symbol Data (Sequential Order)
      setSymbolData({
        January: ['AAPL', 'GOOGL', 'TSLA', 'MSFT'],
        February: ['AMZN', 'NFLX', 'META'],
        March: ['IBM', 'ORCL', 'ADBE'],
      });

      // ✅ Dynamically import and register AgGrid Modules (fixes SSR issue)
      import('ag-grid-community')
        .then(({ ModuleRegistry, AllCommunityModule }) => {
          ModuleRegistry.registerModules([AllCommunityModule]);
        })
        .catch((error) => console.error('Error registering AgGrid modules:', error));
    }
  }, []);

  // Handle View Button Click
  const handleViewSymbols = (month) => {
    setSelectedMonth(month);
    setShowModal(true);
  };

  return (
    <>
      <Row>
        <Col xl={12}>
          <Card className="shadow-sm">
            <CardHeader className="d-flex justify-content-between align-items-center bg-light">
              <CardTitle as="h4">Valuation</CardTitle>
              <Dropdown>
                <ToggleBetweenModals />
              </Dropdown>
            </CardHeader>
            <CardBody className="p-2">
              <div>
                {columnDefs.length > 0 && (
                  <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    domLayout="autoHeight"
                    pagination
                    paginationPageSize={10}
                    defaultColDef={{ sortable: true, filter: true }}
                  />
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Symbol List Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Symbols for {selectedMonth}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {symbolData[selectedMonth]?.length > 0 ? (
            <ul className="list-group">
              {symbolData[selectedMonth].map((symbol, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between">
                  <span>
                    {index + 1}. {symbol}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No symbols available for this month.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ReviewsPage;
