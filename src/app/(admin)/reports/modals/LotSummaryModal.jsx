'use client'

import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { Eye } from 'lucide-react';

// ✅ Register required AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const LotSummaryModal = ({ show, handleClose }) => {
  const columnDefs = [
    { headerName: 'Symbol', field: 'symbol', sortable: true, filter: true, flex: 1 },
    { headerName: 'Lot ID', field: 'lotId', sortable: true, filter: true, flex: 1 },
    { headerName: 'Balance Quantity', field: 'balanceQty', sortable: true, filter: true, flex: 1 },
    { headerName: 'Cost/Unit', field: 'costPerUnit', sortable: true, filter: true, flex: 1 },
    { headerName: 'Amount', field: 'amount', sortable: true, filter: true, flex: 1 },
    { headerName: 'Market Price', field: 'marketPrice', sortable: true, filter: true, flex: 1 },
    { headerName: 'Market Value', field: 'marketValue', sortable: true, filter: true, flex: 1 },
    { headerName: 'UPNL', field: 'upnl', sortable: true, filter: true, flex: 1 },
  ];

  const rowData = [
    { symbol: 'AAPL', lotId: 'L001', balanceQty: 100, costPerUnit: 150, amount: 15000, marketPrice: 155, marketValue: 15500, upnl: 500 },
    { symbol: 'GOOGL', lotId: 'L002', balanceQty: 50, costPerUnit: 2800, amount: 140000, marketPrice: 2850, marketValue: 142500, upnl: 2500 },
  ];

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={20} /> Lot Summary
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* ✅ Fix AG Grid Not Showing Inside Modal */}
        <div style={{ height: 400, width: '100%', minWidth: '900px' }}>
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

export default LotSummaryModal;
