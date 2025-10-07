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

/**
 * Balance Sheet – pulls only from chartofaccounts + journals (as-of date)
 * Sections: Assets, Liabilities, Equity
 * Totals + Balance check: Assets - (Liabilities + Equity)
 */
export default function BalanceSheetModal({
  show,
  handleClose,
  fundId,
  date,                   // 'YYYY-MM-DD'
  retainedGl = '34000',   // retained earnings GL (can override)
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Fetch balance sheet rows
  useEffect(() => {
    if (!show || !fundId || !date) return;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        const params = new URLSearchParams();
        params.set('date', date);
        if (retainedGl) params.set('retained_gl', retainedGl);

        const url = `${apiBase}/api/v1/reports/${encodeURIComponent(
          fundId
        )}/balance-sheet-journals?${params.toString()}`;

        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        // backend shape per our repo: { success, data: { assets, liabilities, equity, totals } }
        const merged =
          json?.data
            ? [...(json.data.assets || []), ...(json.data.liabilities || []), ...(json.data.equity || [])]
            : Array.isArray(json?.rows) ? json.rows : [];

        setRows(Array.isArray(merged) ? merged : []);
      } catch (e) {
        console.error('[BS] fetch failed', e);
        setErr('Failed to load Balance Sheet.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, fundId, date, retainedGl]);

  // group, sort, totals, check
  const {
    assets, liabilities, equity,
    totA, totL, totE, diff,
  } = useMemo(() => {
    const byCat = (cat) =>
      rows
        .filter(r => String(r.category || '').toLowerCase() === cat)
        .sort((a, b) => {
          const A = String(a.gl_code || a.glNumber || a.glnumber || '');
          const B = String(b.gl_code || b.glNumber || b.glnumber || '');
          const ai = /^\d+$/.test(A) ? parseInt(A, 10) : Number.POSITIVE_INFINITY;
          const bi = /^\d+$/.test(B) ? parseInt(B, 10) : Number.POSITIVE_INFINITY;
          return ai - bi || A.localeCompare(B);
        });

    const assets = byCat('asset');
    const liabilities = byCat('liability');
    const equity = byCat('equity');

    const sum = (arr, k) => arr.reduce((s, x) => s + Number(x?.[k] ?? x?.amount ?? 0), 0);
    const totA = sum(assets, 'amount');
    const totL = sum(liabilities, 'amount');
    const totE = sum(equity, 'amount');

    // Accounting check: Assets ?= Liabilities + Equity
    const diff = totA - (totL + totE);

    return { assets, liabilities, equity, totA, totL, totE, diff };
  }, [rows]);

  const renderSection = (title, data) => (
    <>
      <tr className="table-light">
        <th colSpan={2}>{title}</th>
        <th className="text-end">Amount</th>
      </tr>
      {data.map((r, idx) => (
        <tr key={`${title}-${idx}`}>
          <td style={{ width: 120 }}>{r.gl_code || r.glNumber || r.glnumber}</td>
          <td>{r.gl_name || r.glName}</td>
          <td className="text-end">{fmt(r.amount)}</td>
        </tr>
      ))}
    </>
  );

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={18} />
          BALANCE SHEET <span className="text-muted ms-2">{date || ''}</span>
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
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* ASSETS */}
                {renderSection('ASSETS', assets)}
                <tr className="fw-semibold">
                  <td colSpan={2}>Total Assets</td>
                  <td className="text-end">{fmt(totA)}</td>
                </tr>

                {/* LIABILITIES */}
                {renderSection('LIABILITIES', liabilities)}
                <tr className="fw-semibold">
                  <td colSpan={2}>Total Liabilities</td>
                  <td className="text-end">{fmt(totL)}</td>
                </tr>

                {/* EQUITY */}
                {renderSection('EQUITY', equity)}
                <tr className="fw-semibold">
                  <td colSpan={2}>Total Equity</td>
                  <td className="text-end">{fmt(totE)}</td>
                </tr>

                {/* BALANCE CHECK */}
                <tr className={`table-light fw-bold ${Math.abs(diff) > 0.005 ? 'text-danger' : 'text-success'}`}>
                  <td colSpan={2}>
                    Balance Check (A − (L + E))
                  </td>
                  <td className="text-end">{fmt(diff)}</td>
                </tr>
              </tbody>
            </Table>
            {/* hint if not balanced */}
            {Math.abs(diff) > 0.005 && (
              <div className="small text-danger">
                Not balanced: investigate journals, category mapping, or retained earnings GL.
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
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

// const BalanceSheetModal = ({ show, handleClose }) => {
//   const columnDefs = [
//     { headerName: 'GL Number', field: 'glNumber', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Type', field: 'type', sortable: true, filter: true, flex: 1 },
//     { headerName: 'GL Name', field: 'glName', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Amount', field: 'amount', sortable: true, filter: true, flex: 1 },
//   ];

//   const rowData = [
//     { glNumber: '1001', type: 'Asset', glName: 'Cash', amount: 50000 },
//     { glNumber: '2001', type: 'Liability', glName: 'Accounts Payable', amount: 20000 },
//     { glNumber: '3001', type: 'Equity', glName: 'Retained Earnings', amount: 15000 },
//   ];

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> Balance Sheet
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {/* ✅ Fix AG Grid Not Showing Inside Modal */}
//         <div  style={{ height: 400, width: '100%', minWidth: '900px' }}>
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

// export default BalanceSheetModal;
