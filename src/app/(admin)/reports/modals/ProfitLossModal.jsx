'use client';

import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { Button, Modal, Table, Spinner } from 'react-bootstrap';
import { Eye } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken');
  const h = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}
const fmt = (v) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProfitLossModal({
  show,
  handleClose,
  fundId,
  date,                 // 'YYYY-MM-DD'
  legacyStrict = false, // set true if you want to hide all parents (strict mode)
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // fetch P&L rows
  useEffect(() => {
    if (!show || !fundId || !date) return;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const params = new URLSearchParams();
        params.set('date', date);
        if (legacyStrict) params.set('legacy_strict', 'true');
        const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/pnl?${params.toString()}`;
        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        setRows(Array.isArray(json?.rows) ? json.rows : []);
      } catch (e) {
        console.error('[PnL] fetch failed', e);
        setErr('Failed to load P&L data.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, fundId, date, legacyStrict]);

  // group & totals
  const {
    incomeRows, expenseRows,
    incMTD, incQTD, incYTD,
    expMTD, expQTD, expYTD,
    netMTD, netQTD, netYTD,
  } = useMemo(() => {
    const byCat = (cat) =>
      rows
        .filter(r => String(r.category || '').toLowerCase() === cat)
        // sort by numeric GL asc if possible
        .sort((a, b) => {
          const A = String(a.gl_code || a.glNumber || a.glnumber || '');
          const B = String(b.gl_code || b.glNumber || b.glnumber || '');
          const ai = /^\d+$/.test(A) ? parseInt(A, 10) : Number.POSITIVE_INFINITY;
          const bi = /^\d+$/.test(B) ? parseInt(B, 10) : Number.POSITIVE_INFINITY;
          return ai - bi || A.localeCompare(B);
        });

    const incomeRows = byCat('income');
    const expenseRows = byCat('expense');

    const sum = (arr, k) => arr.reduce((s, x) => s + Number(x?.[k] || 0), 0);

    const incMTD = sum(incomeRows, 'mtd_amount');
    const incQTD = sum(incomeRows, 'qtd_amount');
    const incYTD = sum(incomeRows, 'ytd_amount');

    const expMTD = sum(expenseRows, 'mtd_amount');
    const expQTD = sum(expenseRows, 'qtd_amount');
    const expYTD = sum(expenseRows, 'ytd_amount');

    // ✅ Net Income = Income − Expenses (signs preserved exactly as rows carry them)
    const netMTD = incMTD - expMTD;
    const netQTD = incQTD - expQTD;
    const netYTD = incYTD - expYTD;

    return {
      incomeRows, expenseRows,
      incMTD, incQTD, incYTD,
      expMTD, expQTD, expYTD,
      netMTD, netQTD, netYTD,
    };
  }, [rows]);

  const renderSection = (title, data) => (
    <>
      <tr className="table-light">
        <th colSpan={2}>{title}</th>
        <th className="text-end">MTD</th>
        <th className="text-end">QTD</th>
        <th className="text-end">YTD</th>
      </tr>
      {data.map((r, idx) => (
        <tr key={`${title}-${idx}`}>
          <td style={{ width: 120 }}>{r.gl_code || r.glNumber || r.glnumber}</td>
          <td>{r.gl_name || r.glName}</td>
          <td className="text-end">{fmt(r.mtd_amount)}</td>
          <td className="text-end">{fmt(r.qtd_amount)}</td>
          <td className="text-end">{fmt(r.ytd_amount)}</td>
        </tr>
      ))}
    </>
  );

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={18} />
          PROFIT &amp; LOSS – MTD / QTD / YTD <span className="text-muted ms-2">{date || ''}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {err && <div className="text-danger mb-2">{err}</div>}
        {loading ? (
          <div className="d-flex align-items-center gap-2 text-muted">
            <Spinner size="sm" /> Loading…
          </div>
        ) : (
          <div className="table-responsive">
            <Table bordered hover size="sm" className="align-middle">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>GL Number</th>
                  <th>GL Name</th>
                  <th className="text-end">MTD</th>
                  <th className="text-end">QTD</th>
                  <th className="text-end">YTD</th>
                </tr>
              </thead>
              <tbody>
                {/* INCOME */}
                {renderSection('INCOME', incomeRows)}
                <tr className="fw-semibold">
                  <td colSpan={2}>Total Income</td>
                  <td className="text-end">{fmt(incMTD)}</td>
                  <td className="text-end">{fmt(incQTD)}</td>
                  <td className="text-end">{fmt(incYTD)}</td>
                </tr>

                {/* EXPENSES */}
                {renderSection('EXPENSES', expenseRows)}
                <tr className="fw-semibold">
                  <td colSpan={2}>Total Expenses</td>
                  <td className="text-end">{fmt(expMTD)}</td>
                  <td className="text-end">{fmt(expQTD)}</td>
                  <td className="text-end">{fmt(expYTD)}</td>
                </tr>

                {/* NET INCOME */}
                <tr className="table-light fw-bold">
                  <td colSpan={2}>Net Income</td>
                  <td className="text-end">{fmt(netMTD)}</td>
                  <td className="text-end">{fmt(netQTD)}</td>
                  <td className="text-end">{fmt(netYTD)}</td>
                </tr>
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {/* (Optional) add export buttons later */}
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}


// 'use client'

// import { useState } from 'react';
// import { Button, Modal } from 'react-bootstrap';
// import { AgGridReact } from 'ag-grid-react';
// import { ClientSideRowModelModule } from 'ag-grid-community';
// import { ModuleRegistry } from 'ag-grid-community';
// import { Eye } from 'lucide-react';

// // ✅ Register required AG Grid modules
// ModuleRegistry.registerModules([ClientSideRowModelModule]);

// const ProfitLossModal = ({ show, handleClose }) => {
//   const columnDefs = [
//     { headerName: 'GL Number', field: 'glNumber', sortable: true, filter: true, flex: 1 },
//     { headerName: 'GL Name', field: 'glName', sortable: true, filter: true, flex: 1 },
//     { headerName: 'MTD', field: 'mtd', sortable: true, filter: true, flex: 1 },
//     { headerName: 'QTD', field: 'qtd', sortable: true, filter: true, flex: 1 },
//     { headerName: 'YTD', field: 'ytd', sortable: true, filter: true, flex: 1 },
//   ];

//   const rowData = [
//     { glNumber: '4001', glName: 'Revenue', mtd: 50000, qtd: 150000, ytd: 600000 },
//     { glNumber: '5001', glName: 'Cost of Goods Sold', mtd: 20000, qtd: 60000, ytd: 240000 },
//     { glNumber: '6001', glName: 'Operating Expenses', mtd: 10000, qtd: 30000, ytd: 120000 },
//     { glNumber: '7001', glName: 'Net Profit', mtd: 20000, qtd: 60000, ytd: 240000 },
//   ];

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> Profit & Loss (MTD, QTD, YTD)
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {/* ✅ Fix AG Grid Not Showing Inside Modal */}
//         <div className="ag-theme-alpine" style={{ height: 400, width: '100%', minWidth: '900px' }}>
//           <AgGridReact
//             rowData={rowData}
//             columnDefs={columnDefs}
//             rowModelType="clientSide"
//             pagination={true}
//             paginationPageSize={5}
//           />
//         </div>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="secondary" onClick={handleClose}>Close</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default ProfitLossModal;