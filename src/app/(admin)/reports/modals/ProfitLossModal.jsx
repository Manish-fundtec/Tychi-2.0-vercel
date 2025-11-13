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
        const rawRows = Array.isArray(json?.rows) ? json.rows : [];
        const remapGlCode = (code, name) => {
          const normalizedCode = String(code || '').trim();
          const normalizedName = String(name || '').toLowerCase();
          if (normalizedCode === '41000') {
            if (normalizedName.includes('short')) return '41200';
            return '41100';
          }
          return normalizedCode || code || '';
        };
        const normalizedRows = rawRows.map((r) => {
          const remappedCode = remapGlCode(r.gl_code ?? r.glNumber ?? r.glnumber, r.gl_name ?? r.glName);
          const code = String(remappedCode || '').trim();
          const existingCategory = typeof r.category === 'string' ? r.category : '';
          return {
            ...r,
            gl_code: remappedCode,
            glNumber: remappedCode,
            category: !existingCategory && (code === '41100' || code === '41200') ? 'Income' : existingCategory,
          };
        });
        setRows(normalizedRows);
      } catch (e) {
        console.error('[PnL] fetch failed', e);
        setErr('Failed to load P&L data.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, fundId, date, legacyStrict]);

  const handleExportCsv = () => {
    if (!rows?.length) {
      alert('No P&L rows to export.');
      return;
    }

    const headers = [
      { key: 'category', label: 'Category' },
      { key: 'gl_code', label: 'GL Number' },
      { key: 'gl_name', label: 'GL Name' },
      { key: 'mtd_amount', label: 'MTD' },
      { key: 'qtd_amount', label: 'QTD' },
      { key: 'ytd_amount', label: 'YTD' },
    ];

    const escapeCsv = (value) => {
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
      }
      return stringValue;
    };

    const formatValue = (key, value) =>
      ['mtd_amount', 'qtd_amount', 'ytd_amount'].includes(key) ? fmt(value) : value ?? '';

    const headerRow = headers.map(({ label }) => escapeCsv(label)).join(',');
    const dataRows = rows.map((row) =>
      headers
        .map(({ key }) => escapeCsv(formatValue(key, row[key])))
        .join(','),
    );

    const csvContent = ['\ufeff' + headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `profit-loss-${fundId || 'fund'}-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

      <Modal.Footer className="d-flex justify-content-end gap-2">
        <Button variant="outline-success" size="sm" disabled={!rows?.length || loading} onClick={handleExportCsv}>
          Export CSV
        </Button>
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