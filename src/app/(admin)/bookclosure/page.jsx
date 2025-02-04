'use client' // ✅ Ensures this is a Client Component

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Dropdown } from 'react-bootstrap'

// ✅ Dynamically Import Components to Prevent SSR Issues
const AgGridReact = dynamic(() => import('ag-grid-react').then(mod => mod.AgGridReact), { ssr: false });
const MGLEntryModal = dynamic(() => import('../base-ui/modals/components/AllModals').then(mod => mod.MGLEntryModal), { ssr: false });

const BookClosurePage = () => {
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/assets/tychiData/columnDefs')
        .then((colmdefs) => {
          setColumnDefs(colmdefs.bookclosureColDefs || []);
        })
        .catch((error) => {
          console.error('Error loading columnDefs:', error);
          setColumnDefs([]);
        });

      setRowData([
        { srNo: 1, month: 'January', date: '2025-01-01', status: 'Pending' },
        { srNo: 2, month: 'February', date: '2025-02-14', status: 'Completed' },
      ]);

      // ✅ Move ModuleRegistry inside useEffect
      import('ag-grid-community')
        .then(({ ModuleRegistry, AllCommunityModule }) => {
          ModuleRegistry.registerModules([AllCommunityModule]);
        })
        .catch((error) => console.error('Error registering AgGrid modules:', error));
    }
  }, []);

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Book Closure</CardTitle>
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
                  defaultColDef={{ sortable: true, filter: true }} // ✅ Ensures proper default settings
                />
              )}
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default BookClosurePage;
