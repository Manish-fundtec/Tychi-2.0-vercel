'use client'

import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { Eye } from 'lucide-react';

// ✅ Register required AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const PurchaseSalesModal = ({ show, handleClose }) => {
  const columnDefs = [
    { headerName: 'Month', field: 'month', sortable: true, filter: true, flex: 1 },
    { headerName: 'Ticker', field: 'ticker', sortable: true, filter: true, flex: 1 },
    { headerName: 'Open Long', field: 'open_long', sortable: true, filter: true, flex: 1 },
    { headerName: 'Close Long', field: 'close_long', sortable: true, filter: true, flex: 1 },
    { headerName: 'Open Short', field: 'open_short', sortable: true, filter: true, flex: 1 },
    { headerName: 'Close Short', field: 'close_short', sortable: true, filter: true, flex: 1 },
  ];

  const rowData = [
    { month: 'January', ticker: 'AAPL', open_long: 100, close_long: 50, open_short: 30, close_short: 20 },
    { month: 'February', ticker: 'GOOGL', open_long: 80, close_long: 40, open_short: 20, close_short: 10 },
    { month: 'March', ticker: 'TSLA', open_long: 90, close_long: 45, open_short: 25, close_short: 15 },
  ];

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={20} /> Purchase and Sales
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* ✅ Fix AG Grid Not Showing Inside Modal */}
        <div className="ag-theme-alpine" style={{ height: 400, width: '100%', minWidth: '900px' }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            rowModelType="clientSide"
            pagination={true}
            paginationPageSize={5}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PurchaseSalesModal;