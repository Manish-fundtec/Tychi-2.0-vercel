'use client'

import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { Eye } from 'lucide-react';

// ✅ Register required AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const ProfitLossModal = ({ show, handleClose }) => {
  const columnDefs = [
    { headerName: 'GL Number', field: 'glNumber', sortable: true, filter: true, flex: 1 },
    { headerName: 'GL Name', field: 'glName', sortable: true, filter: true, flex: 1 },
    { headerName: 'MTD', field: 'mtd', sortable: true, filter: true, flex: 1 },
    { headerName: 'QTD', field: 'qtd', sortable: true, filter: true, flex: 1 },
    { headerName: 'YTD', field: 'ytd', sortable: true, filter: true, flex: 1 },
  ];

  const rowData = [
    { glNumber: '4001', glName: 'Revenue', mtd: 50000, qtd: 150000, ytd: 600000 },
    { glNumber: '5001', glName: 'Cost of Goods Sold', mtd: 20000, qtd: 60000, ytd: 240000 },
    { glNumber: '6001', glName: 'Operating Expenses', mtd: 10000, qtd: 30000, ytd: 120000 },
    { glNumber: '7001', glName: 'Net Profit', mtd: 20000, qtd: 60000, ytd: 240000 },
  ];

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={20} /> Profit & Loss (MTD, QTD, YTD)
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

export default ProfitLossModal;