'use client';

import { useEffect, useMemo, useState, useCallback, Fragment } from 'react';
import Cookies from 'js-cookie';
import { Button, Modal, Table, Form, Row, Col, Spinner } from 'react-bootstrap';
import { Eye } from 'lucide-react';
import { buildAoaFromHeaders, exportAoaToXlsx } from '@/lib/exporters/xlsx';
import { useDashboardToken } from '@/hooks/useDashboardToken';
import { getFundDetails } from '@/lib/api/fund';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken');
  const h = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// --- Helpers to derive category from GL number ---
const extractLeadingInt = (gl) => {
  const m = String(gl ?? '').match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : NaN;
};
const glToCategory = (gl) => {
  const n = extractLeadingInt(gl);
  if (!Number.isFinite(n)) return 'Other';
  if (n >= 10000 && n < 20000) return 'Asset';
  if (n >= 20000 && n < 30000) return 'Liability';
  if (n >= 30000 && n < 40000) return 'Equity';
  if (n >= 40000 && n < 50000) return 'Income';
  if (n >= 50000 && n <= 60000) return 'Expense'; // upper bound inclusive as requested
  return 'Other';
};

const EXCLUDED_PARENT_GL_CODES = new Set(['11000', '12000', '21200']);

export default function TrialBalanceModalGrouped({
  show,
  handleClose,
  fundId,
  date,                // 'YYYY-MM-DD'
  defaultScope = 'MTD' // MTD | QTD | YTD | PTD
}) {
  // Get reporting frequency from dashboard token
  const dashboard = useDashboardToken();
  const reportingFrequency = String(dashboard?.fund?.reporting_frequency || dashboard?.reporting_frequency || 'monthly').toLowerCase();
  
  // Set default scope based on frequency
  const getDefaultScope = useCallback(() => {
    if (reportingFrequency === 'daily') return 'PTD';
    if (reportingFrequency === 'monthly') return 'MTD';
    if (reportingFrequency === 'quarterly' || reportingFrequency === 'quarter') return 'QTD';
    if (reportingFrequency === 'annual' || reportingFrequency === 'annually') return 'YTD';
    return String(defaultScope).toUpperCase(); // fallback to provided defaultScope
  }, [reportingFrequency, defaultScope]);
  
  const [scope, setScope] = useState(() => getDefaultScope());
  
  // Update scope when modal opens or frequency changes (like GL Reports)
  useEffect(() => {
    if (show) {
      setScope(getDefaultScope());
    }
  }, [show, reportingFrequency, getDefaultScope]);
  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
   const [fundDetails, setFundDetails] = useState(null);
  
  // Fetch fund details to get current decimal_precision
  useEffect(() => {
    if (!fundId) {
      setFundDetails(null);
      return;
    }
    
    const fetchFund = async () => {
      try {
        const details = await getFundDetails(fundId);
        setFundDetails(details);
      } catch (error) {
        console.error('Failed to fetch fund details:', error);
        setFundDetails(null);
      }
    };
    
    fetchFund();
  }, [fundId]);
  
  // Get decimal precision - prioritize fund details from API, then token, then default to 2
  const decimalPrecision = useMemo(() => {
    const apiPrecision = fundDetails?.decimal_precision;
    const tokenPrecision = dashboard?.decimal_precision ?? dashboard?.fund?.decimal_precision;
    const precision = apiPrecision ?? tokenPrecision;
    const numPrecision = precision !== null && precision !== undefined ? Number(precision) : null;
    return numPrecision !== null && !isNaN(numPrecision) ? numPrecision : 2;
  }, [fundDetails, dashboard]);
  
  // Format function using dynamic decimal precision
  const fmt = useCallback((v) => {
    return Number(v || 0).toLocaleString(undefined, { 
      minimumFractionDigits: decimalPrecision, 
      maximumFractionDigits: decimalPrecision 
    });
  }, [decimalPrecision]);
  const exportHeaders = useMemo(
    () => [
      { key: 'category', label: 'Category' },
      { key: 'glNumber', label: 'GL Number' },
      { key: 'glName', label: 'GL Name' },
      { key: 'opening', label: 'Opening Balance' },
      { key: 'debit', label: 'Debit' },
      { key: 'credit', label: 'Credit' },
      { key: 'closing', label: 'Closing Balance' },
    ],
    [],
  );
  const formatExportValue = (key, value) =>
    ['opening', 'debit', 'credit', 'closing'].includes(String(key)) ? fmt(value) : value ?? '';

  // fetch TB rows
  useEffect(() => {
    if (!show || !fundId || !date) return;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const params = new URLSearchParams();
        params.set('date', date);
        params.set('scope', scope);
        const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl-trial?${params.toString()}`;
        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        // normalize API -> FE shape (category from API is ignored later)
        const data = (json?.data || json?.rows || []).map(r => ({
          glNumber: r.glNumber ?? r.glnumber ?? r.gl_code ?? '',
          glName: r.glName ?? r.gl_name ?? '',
          opening: Number(r.opening_balance ?? r.openingbalance ?? 0),
          debit: Number(r.debit_amount ?? r.debit ?? 0),
          credit: Number(r.credit_amount ?? r.credit ?? 0),
          closing: Number(r.closing_balance ?? r.closingbalance ?? 0),
        })).filter(item => {
          const code = String(item.glNumber || '').trim();
          return code && !EXCLUDED_PARENT_GL_CODES.has(code);
        });

        setRows(data);
      } catch (e) {
        console.error('[TB grouped] fetch failed', e);
        setErr('Failed to load trial balance.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, fundId, date, scope]);

  // group by derived category (from GL code ranges) + subtotals + grand totals
  const groups = useMemo(() => {
    // derive category for each row
    const derived = rows.map(r => ({
      ...r,
      category: glToCategory(r.glNumber),
    }));

    const order = ['Asset', 'Liability', 'Equity', 'Income', 'Expense', 'Other'];
    const byCat = {};
    for (const r of derived) {
      const key = r.category || 'Other';
      if (!byCat[key]) byCat[key] = [];
      byCat[key].push(r);
    }

    // sorting inside each group: numeric GL number asc, fallback to lexicographic
    const sortGL = (a, b) => {
      const A = String(a.glNumber || '');
      const B = String(b.glNumber || '');
      const ai = /^\d+$/.test(A) ? parseInt(A, 10) : extractLeadingInt(A);
      const bi = /^\d+$/.test(B) ? parseInt(B, 10) : extractLeadingInt(B);
      const na = Number.isFinite(ai) ? ai : Number.POSITIVE_INFINITY;
      const nb = Number.isFinite(bi) ? bi : Number.POSITIVE_INFINITY;
      return na - nb || A.localeCompare(B);
    };

    const cats = Object.keys(byCat).sort((a, b) => {
      const ia = order.indexOf(a); const ib = order.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    const sections = [];
    let G_open = 0, G_dr = 0, G_cr = 0, G_close = 0;

    for (const cat of cats) {
      const arr = byCat[cat].slice().sort(sortGL);
      const sum = (k) => arr.reduce((s, x) => s + Number(x[k] || 0), 0);
      const t_open = sum('opening');
      const t_dr   = sum('debit');
      const t_cr   = sum('credit');
      const t_close= sum('closing');

      G_open += t_open; G_dr += t_dr; G_cr += t_cr; G_close += t_close;

      sections.push({
        category: cat,
        rows: arr,
        totals: { opening: t_open, debit: t_dr, credit: t_cr, closing: t_close },
      });
    }

    const grand = { opening: G_open, debit: G_dr, credit: G_cr, closing: G_close };
    return { sections, grand };
  }, [rows]);

  const handleExportCsv = () => {
    const flatRows = groups.sections.flatMap((sec) =>
      sec.rows.map((r) => ({ ...r, category: sec.category })),
    );

    if (!flatRows.length) {
      alert('No trial balance rows to export.');
      return;
    }

    const escapeCsv = (value) => {
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
      }
      return stringValue;
    };

    const headerRow = exportHeaders.map(({ label }) => escapeCsv(label)).join(',');
    const dataRows = flatRows.map((row) =>
      exportHeaders
        .map(({ key }) => escapeCsv(formatExportValue(key, row[key])))
        .join(','),
    );

    const csvContent = ['\ufeff' + headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `trial-balance-${scope}-${fundId || 'fund'}-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const handleExportXlsx = () => {
    const flatRows = groups.sections.flatMap((sec) =>
      sec.rows.map((r) => ({ ...r, category: sec.category })),
    );
    if (!flatRows.length) {
      alert('No trial balance rows to export.');
      return;
    }
    const aoa = buildAoaFromHeaders(exportHeaders, flatRows, formatExportValue);
    exportAoaToXlsx({
      fileName: `trial-balance-${scope}-${fundId || 'fund'}-${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Trial Balance',
      aoa,
    });
  };

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={18} />
          Trial Balance — <span className="text-muted">{date || ''}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="mb-3">
          <Row className="g-3 align-items-end">
            <Col sm="auto">
              <Form.Label>Scope</Form.Label>
              <Form.Select value={scope} onChange={(e) => setScope(e.target.value)}>
                {reportingFrequency === 'daily' && <option value="PTD">PTD</option>}
                {(reportingFrequency === 'daily' || reportingFrequency === 'monthly') && <option value="MTD">MTD</option>}
                {(reportingFrequency === 'daily' || reportingFrequency === 'monthly' || reportingFrequency === 'quarterly' || reportingFrequency === 'quarter') && <option value="QTD">QTD</option>}
                <option value="YTD">YTD</option>
              </Form.Select>
              <Form.Text muted>Period derived from selected date.</Form.Text>
            </Col>
          </Row>
        </Form>

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
                  <th className="text-end">Opening Balance</th>
                  <th className="text-end">Debit</th>
                  <th className="text-end">Credit</th>
                  <th className="text-end">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {groups.sections.map((sec) => (
                  <Fragment key={sec.category}>
                    {/* Section header */}
                    <tr className="table-light">
                      <th colSpan={6}>{sec.category.toUpperCase()}</th>
                    </tr>

                    {/* Section rows */}
                    {sec.rows.map((r, i) => (
                      <tr key={`${sec.category}-${r.glNumber}-${i}`}>
                        <td>{r.glNumber}</td>
                        <td>{r.glName}</td>
                        <td className="text-end">{fmt(r.opening)}</td>
                        <td className="text-end">{fmt(r.debit)}</td>
                        <td className="text-end">{fmt(r.credit)}</td>
                        <td className="text-end">{fmt(r.closing)}</td>
                      </tr>
                    ))}

                    {/* Section totals */}
                    <tr className="fw-semibold">
                      <td colSpan={2}>Total {sec.category}</td>
                      <td className="text-end">{fmt(sec.totals.opening)}</td>
                      <td className="text-end">{fmt(sec.totals.debit)}</td>
                      <td className="text-end">{fmt(sec.totals.credit)}</td>
                      <td className="text-end">{fmt(sec.totals.closing)}</td>
                    </tr>
                  </Fragment>
                ))}

                {/* Grand total (all categories) */}
                <tr className="table-light fw-bold">
                  <td colSpan={2}>TOTAL</td>
                  <td className="text-end">{fmt(groups.grand.opening)}</td>
                  <td className="text-end">{fmt(groups.grand.debit)}</td>
                  <td className="text-end">{fmt(groups.grand.credit)}</td>
                  <td className="text-end">{fmt(groups.grand.closing)}</td>
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
        <Button variant="outline-primary" size="sm" disabled={!rows?.length || loading} onClick={handleExportXlsx}>
          Export XLSX
        </Button>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}





// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import dynamic from 'next/dynamic';
// import Cookies from 'js-cookie';
// import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
// import { ModuleRegistry } from 'ag-grid-community';
// import { Eye } from 'lucide-react';

// // AG Grid
// import { AllCommunityModule } from 'ag-grid-community';
// ModuleRegistry.registerModules([AllCommunityModule]);

// // SSR-safe AgGridReact
// const AgGridReact = dynamic(() => import('ag-grid-react').then(m => m.AgGridReact), { ssr: false });

// const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// function getAuthHeaders() {
//   const token = Cookies.get('dashboardToken');
//   const h = { Accept: 'application/json' };
//   if (token) h.Authorization = `Bearer ${token}`;
//   return h;
// }

// const fmt = (v) =>
//   Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// export default function TrialBalanceMTDModal({ show, handleClose, fundId, date }) {
//   const [scope, setScope] = useState('MTD');
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState('');
//   const [gridApi, setGridApi] = useState(null);
//   const [pinnedBottom, setPinnedBottom] = useState([]);

//   const columnDefs = useMemo(
//     () => [
//       { headerName: 'Category', field: 'category', sortable: true, filter: true, flex: 1 },
//       { headerName: 'Type', field: 'type', sortable: true, filter: true, width: 100 },
//       { headerName: 'GL Number', field: 'glNumber', sortable: true, filter: true, width: 130 },
//       { headerName: 'GL Name', field: 'glName', sortable: true, filter: true, flex: 1.5 },
//       {
//         headerName: 'Opening Balance',
//         field: 'openingbalance',
//         sortable: true,
//         filter: 'agNumberColumnFilter',
//         width: 160,
//         valueFormatter: (p) => (p.value == null ? '' : fmt(p.value)),
//       },
//       {
//         headerName: 'Debit',
//         field: 'debit',
//         sortable: true,
//         filter: 'agNumberColumnFilter',
//         width: 140,
//         valueFormatter: (p) => (p.value == null ? '' : fmt(p.value)),
//       },
//       {
//         headerName: 'Credit',
//         field: 'credit',
//         sortable: true,
//         filter: 'agNumberColumnFilter',
//         width: 140,
//         valueFormatter: (p) => (p.value == null ? '' : fmt(p.value)),
//       },
//       {
//         headerName: 'Closing Balance',
//         field: 'closingbalance',
//         sortable: true,
//         filter: 'agNumberColumnFilter',
//         width: 170,
//         valueFormatter: (p) => (p.value == null ? '' : fmt(p.value)),
//       },
//     ],
//     []
//   );

//   // Fetch Trial Balance data
//   useEffect(() => {
//     if (!show || !fundId || !date) return;
//     (async () => {
//       try {
//         setLoading(true);
//         setErr('');

//         const params = new URLSearchParams();
//         params.set('date', date);
//         params.set('scope', String(scope).toUpperCase());

//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl-trial?${params.toString()}`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//         const json = await resp.json();

//         // API returns: data: [{category, type, glNumber, glName, opening_balance, debit_amount, credit_amount, closing_balance}]
//         const list = (json?.data || []).map((r) => ({
//           category: r.category,
//           type: r.type,
//           glNumber: r.glNumber,
//           glName: r.glName,
//           openingbalance: Number(r.opening_balance || 0),
//           debit: Number(r.debit_amount || 0),
//           credit: Number(r.credit_amount || 0),
//           closingbalance: Number(r.closing_balance || 0),
//         }));

//         setRows(list);

//         // totals row (prefer API totals if provided)
//         const tot = json?.totals || {};
//         const opening_total =
//           tot.opening_balance != null
//             ? Number(tot.opening_balance)
//             : list.reduce((s, r) => s + (r.openingbalance || 0), 0);
//         const debit_total =
//           tot.debit_amount != null
//             ? Number(tot.debit_amount)
//             : list.reduce((s, r) => s + (r.debit || 0), 0);
//         const credit_total =
//           tot.credit_amount != null
//             ? Number(tot.credit_amount)
//             : list.reduce((s, r) => s + (r.credit || 0), 0);
//         const closing_total =
//           tot.closing_balance != null
//             ? Number(tot.closing_balance)
//             : list.reduce((s, r) => s + (r.closingbalance || 0), 0);

//         setPinnedBottom([
//           {
//             category: '',
//             type: '',
//             glNumber: '',
//             glName: 'TOTAL',
//             // openingbalance: opening_total,
//             debit: debit_total,
//             credit: credit_total,
//             closingbalance: closing_total,
//           },
//         ]);
//       } catch (e) {
//         console.error('[TrialBalance] fetch failed', e);
//         setErr('Failed to load trial balance.');
//         setRows([]);
//         setPinnedBottom([]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [show, fundId, date, scope]);

//   // apply pinned bottom on grid ready/changes
//   useEffect(() => {
//     if (!gridApi) return;
//     if (typeof gridApi.setGridOption === 'function') {
//       gridApi.setGridOption('pinnedBottomRowData', pinnedBottom);
//     }
//   }, [gridApi, pinnedBottom]);

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> Trial Balance — <span className="text-muted">{date || '-'}</span>
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Form className="mb-2">
//           <Row className="g-3 align-items-end">
//             <Col md={4}>
//               <Form.Label>Scope</Form.Label>
//               <Form.Select value={scope} onChange={(e) => setScope(e.target.value)}>
//                 <option value="MTD">MTD</option>
//                 <option value="QTD">QTD</option>
//                 <option value="YTD">YTD</option>
//               </Form.Select>
//               <Form.Text muted>Period derived from selected date.</Form.Text>
//             </Col>
//           </Row>
//         </Form>

//         {err && <div className="text-danger mb-2">{err}</div>}

//         <div style={{ height: 460, width: '100%', minWidth: 900 }}>
//           <AgGridReact
//             rowData={rows}
//             columnDefs={columnDefs}
//             rowModelType="clientSide"
//             pagination
//             paginationPageSize={10}
//             defaultColDef={{ resizable: true }}
//             overlayLoadingTemplate={
//               loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
//             }
//             pinnedBottomRowData={pinnedBottom}
//             onGridReady={(params) => setGridApi(params.api)}
//             onFirstDataRendered={(params) => {
//               const api = params.api;
//               if (typeof api.setGridOption === 'function') {
//                 api.setGridOption('pinnedBottomRowData', pinnedBottom);
//               }
//             }}
//           />
//         </div>
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={handleClose}>
//           Close
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }




// 'use client'

// import { useState } from 'react';
// import { Button, Modal } from 'react-bootstrap';
// import { AgGridReact } from 'ag-grid-react';
// import { ClientSideRowModelModule } from 'ag-grid-community';
// import { ModuleRegistry } from 'ag-grid-community';
// import { Eye } from 'lucide-react';

// // ✅ Register required AG Grid modules
// ModuleRegistry.registerModules([ClientSideRowModelModule]);

// const TrialBalanceMTDModal = ({ show, handleClose }) => {
//   const columnDefs = [
//     { headerName: 'GL Number', field: 'glNumber', sortable: true, filter: true, flex: 1 },
//     { headerName: 'GL Name', field: 'glName', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Opening Bannce', field: 'openingbalance', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Debit', field: 'debit', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Credit', field: 'credit', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Closing Balance', field: 'closingbalance', sortable: true, filter: true, flex: 1 },
//   ];

//   const rowData = [
//     { glNumber: '11001', glName: 'Velocity', openingbalance: 0.00, debit: 87674572.10, credit: 87581321.72, closingbalance: 93250.38 },
//     { glNumber: '11002', glName: 'Clear Street', openingbalance: 0.00, debit: 2098820648.32, credit: 2112353219.89, closingbalance: -13532571.57 },
//     { glNumber: '12001', glName: 'Morgan Stanley', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
//     { glNumber: '13110', glName: 'Stock', openingbalance: 0.00, debit: 1074234678.63, credit: 1053739039.70, closingbalance: 20495638.94 },
//     { glNumber: '13210', glName: 'Stock', openingbalance: 0.00, debit: 512712.86, credit: 20297672.13, closingbalance: -19784959.27 },
//     { glNumber: '14000', glName: 'Investment Clearing', openingbalance: 0.00, debit: 4388087653.59, credit: 4388050679.67, closingbalance: 36973.92 },
//     { glNumber: '21110', glName: 'Stock', openingbalance: 0.00, debit: 1125806514.45, credit: 1132562166.57, closingbalance: 6755652.12 },
//     { glNumber: '21210', glName: 'Stock', openingbalance: 0.00, debit: 6415199.24, credit: 86554.96, closingbalance: -6328644.28 },
//     { glNumber: '31000', glName: 'Opening Equity', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
//     { glNumber: '32000', glName: 'Contribution', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
//     { glNumber: '33000', glName: 'Distribution', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
//     { glNumber: '34000', glName: 'Retained Earning', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
//     { glNumber: '41100', glName: 'Long Term Realized P&L', openingbalance: 0.00, debit: 0.00, credit: 0.00, closingbalance: 0.00 },
//     { glNumber: '41200', glName: 'Short Term Realized P&L', openingbalance: 0.00, debit: 1514266.17, credit: 1851905.71, closingbalance: 337639.55 },
//     { glNumber: '42000', glName: 'Unrealized P&L', openingbalance: 0.00, debit: 20384227.09, credit: 6927912.10, closingbalance: -13456314.99 }
//   ];
  

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> Trial Balance MTD Sheet
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {/* ✅ Fix AG Grid Not Showing Inside Modal */}
//         <div style={{ height: 400, width: '100%', minWidth: '900px' }}>
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

// export default TrialBalanceMTDModal;
