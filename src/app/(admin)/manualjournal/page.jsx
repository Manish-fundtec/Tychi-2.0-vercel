'use client'; // ✅ Ensures this is a Client Component

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Dropdown } from 'react-bootstrap';

// ✅ Dynamically import MGLEntryModal to avoid SSR issues
const MGLEntryModal = dynamic(() => import('../base-ui/modals/components/AllModals').then(mod => mod.MGLEntryModal), {
  ssr: false,
});

// ✅ Dynamically import AgGridReact to prevent SSR issues
const AgGridReact = dynamic(() => import('ag-grid-react').then(mod => mod.AgGridReact), {
  ssr: false,
});

const ManualJournalPage = () => {
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // ✅ Import colmdefs safely & handle errors
      import('@/assets/tychiData/columnDefs')
        .then((colmdefs) => {
          setColumnDefs(colmdefs.manualJournalColDefs || []);
        })
        .catch((error) => {
          console.error('Error loading columnDefs:', error);
          setColumnDefs([]);
        });

      // ✅ Set row data
      setRowData([
        { srNo: 1, month: 'January', date: '2025-01-01', status: 'Pending' },
        { srNo: 2, month: 'February', date: '2025-02-14', status: 'Completed' },
      ]);

      // ✅ Dynamically import and register AgGrid Modules (fixes SSR issue)
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
                  defaultColDef={{ sortable: true, filter: true }} // Ensure default settings
                />
              )}
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default ManualJournalPage;
