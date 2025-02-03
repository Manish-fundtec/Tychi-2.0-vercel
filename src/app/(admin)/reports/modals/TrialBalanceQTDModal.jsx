'use client'

import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { Eye } from 'lucide-react';

// ✅ Register required AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const TrialBalanceQTDModal = ({ show, handleClose }) => {
  const columnDefs = [
    { headerName: 'GL Number', field: 'glNumber', sortable: true, filter: true, flex: 1 },
    { headerName: 'GL Name', field: 'glName', sortable: true, filter: true, flex: 1 },
    { headerName: 'Opening Bannce', field: 'openingbalance', sortable: true, filter: true, flex: 1 },
    { headerName: 'Debit', field: 'debit', sortable: true, filter: true, flex: 1 },
    { headerName: 'Credit', field: 'credit', sortable: true, filter: true, flex: 1 },
    { headerName: 'Closing Balance', field: 'closingbalance', sortable: true, filter: true, flex: 1 },
  ];

  const rowData = [
    { glNumber: '11001', glName: 'Velocity', openingbalance: 0.00, debit: 87674572.10, credit: 87581321.72, closingbalance: 93250.38 },
    { glNumber: '11002', glName: 'Clear Street', openingbalance: 0.00, debit: 2098820648.32, credit: 2112353219.89, closingbalance: -13532571.57 },
    { glNumber: '12001', glName: 'Morgan Stanley', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
    { glNumber: '13110', glName: 'Stock', openingbalance: 0.00, debit: 1074234678.63, credit: 1053739039.70, closingbalance: 20495638.94 },
    { glNumber: '13210', glName: 'Stock', openingbalance: 0.00, debit: 512712.86, credit: 20297672.13, closingbalance: -19784959.27 },
    { glNumber: '14000', glName: 'Investment Clearing', openingbalance: 0.00, debit: 4388087653.59, credit: 4388050679.67, closingbalance: 36973.92 },
    { glNumber: '21110', glName: 'Stock', openingbalance: 0.00, debit: 1125806514.45, credit: 1132562166.57, closingbalance: 6755652.12 },
    { glNumber: '21210', glName: 'Stock', openingbalance: 0.00, debit: 6415199.24, credit: 86554.96, closingbalance: -6328644.28 },
    { glNumber: '31000', glName: 'Opening Equity', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
    { glNumber: '32000', glName: 'Contribution', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
    { glNumber: '33000', glName: 'Distribution', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
    { glNumber: '34000', glName: 'Retained Earning', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
    { glNumber: '41100', glName: 'Long Term Realized P&L', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
    { glNumber: '41200', glName: 'Short Term Realized P&L', openingbalance: 0.00, debit: 1514266.17, credit: 1851905.71, closingbalance: 337639.55 },
    { glNumber: '42000', glName: 'Unrealized P&L', openingbalance: 0.00, debit: 20384227.09, credit: 6927912.10, closingbalance: -13456314.99 }
  ];
  

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={20} /> Trial Balance QTD Sheet
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

export default TrialBalanceQTDModal;
