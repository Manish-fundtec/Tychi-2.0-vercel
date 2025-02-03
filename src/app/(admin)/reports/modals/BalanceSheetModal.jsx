'use client'

import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { Eye } from 'lucide-react';

// ✅ Register required AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const BalanceSheetModal = ({ show, handleClose }) => {
  const columnDefs = [
    { headerName: 'GL Number', field: 'glNumber', sortable: true, filter: true, flex: 1 },
    { headerName: 'Type', field: 'type', sortable: true, filter: true, flex: 1 },
    { headerName: 'GL Name', field: 'glName', sortable: true, filter: true, flex: 1 },
    { headerName: 'Amount', field: 'amount', sortable: true, filter: true, flex: 1 },
  ];

  const rowData = [
    { glNumber: '1001', type: 'Asset', glName: 'Cash', amount: 50000 },
    { glNumber: '2001', type: 'Liability', glName: 'Accounts Payable', amount: 20000 },
    { glNumber: '3001', type: 'Equity', glName: 'Retained Earnings', amount: 15000 },
  ];

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={20} /> Balance Sheet
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* ✅ Fix AG Grid Not Showing Inside Modal */}
        <div  style={{ height: 400, width: '100%', minWidth: '900px' }}>
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

export default BalanceSheetModal;
