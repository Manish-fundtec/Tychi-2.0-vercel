'use client'

import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { Eye } from 'lucide-react';

// ✅ Register required AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const RPNLReportModal = ({ show, handleClose }) => {
  const columnDefs = [
    { headerName: 'Symbol', field: 'symbol', sortable: true, filter: true, flex: 1 },
    { headerName: 'Trade ID', field: 'tradeId', sortable: true, filter: true, flex: 1 },
    { headerName: 'Lot ID', field: 'lotId', sortable: true, filter: true, flex: 1 },
    { headerName: 'Open Date', field: 'openDate', sortable: true, filter: true, flex: 1 },
    { headerName: 'Open Price', field: 'openPrice', sortable: true, filter: true, flex: 1 },
    { headerName: 'Close Date', field: 'closeDate', sortable: true, filter: true, flex: 1 },
    { headerName: 'Close Price', field: 'closePrice', sortable: true, filter: true, flex: 1 },
    { headerName: 'Quantity', field: 'quantity', sortable: true, filter: true, flex: 1 },
    { headerName: 'Long Term RPNL', field: 'longTermRpnl', sortable: true, filter: true, flex: 1 },
    { headerName: 'Short Term RPNL', field: 'shortTermRpnl', sortable: true, filter: true, flex: 1 },
    { headerName: 'Total RPNL', field: 'totalRpnl', sortable: true, filter: true, flex: 1 },
  ];

  const rowData = [
    { symbol: 'AAPL', tradeId: 'T001', lotId: 'L001', openDate: '2024-01-10', openPrice: 150, closeDate: '2024-01-20', closePrice: 155, quantity: 100, longTermRpnl: 300, shortTermRpnl: 200, totalRpnl: 500 },
    { symbol: 'GOOGL', tradeId: 'T002', lotId: 'L002', openDate: '2024-02-15', openPrice: 2800, closeDate: '2024-02-25', closePrice: 2850, quantity: 50, longTermRpnl: 1500, shortTermRpnl: 1000, totalRpnl: 2500 },
  ];

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={20} /> RPNL Report
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

export default RPNLReportModal;
