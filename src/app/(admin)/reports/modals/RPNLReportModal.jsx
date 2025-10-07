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
const fmt = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RPNLReportModal({ show, handleClose, fundId, date, orgId }) {
  const [rows, setRows]   = useState([]);
  const [totals, setTotals] = useState({ quantity:0, closingProceeds:0, longTermRpnl:0, shortTermRpnl:0, totalRpnl:0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!show || !fundId || !date) return;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const params = new URLSearchParams();
        params.set('date', date);                // e.g. '2025-07-31'
        if (orgId) params.set('orgId', orgId);
        const url = `${apiBase}/api/v1/reports/${encodeURIComponent(
          fundId
        )}/realized-pnl?${params.toString()}`;

        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        // backend handler returns: { ok, period, rows, totals, count }
        setRows(Array.isArray(json?.rows) ? json.rows : []);
        setTotals(json?.totals || { quantity:0, closingProceeds:0, longTermRpnl:0, shortTermRpnl:0, totalRpnl:0 });
        console.log('[RPNL] rows:', json?.rows?.length, json);  // << debug
      } catch (e) {
        console.error('[RPNL] fetch failed', e);
        setErr('Failed to load RPNL data.');
        setRows([]); setTotals({ quantity:0, closingProceeds:0, longTermRpnl:0, shortTermRpnl:0, totalRpnl:0 });
      } finally {
        setLoading(false);
      }
    })();
  }, [show, fundId, date, orgId]);

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={18} />
          REALIZED P&L <span className="text-muted ms-2">{date || ''}</span>
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
                  <th>Symbol</th>
                  <th>Trade ID</th>
                  <th>Lot ID</th>
                  <th>Open Date</th>
                  <th>Open Price</th>
                  <th>Close Date</th>
                  <th>Close Price</th>
                  <th className="text-end">Quantity</th>
                  <th className="text-end">Long Term RPNL</th>
                  <th className="text-end">Short Term RPNL</th>
                  <th className="text-end">Total RPNL</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.symbol}</td>
                    <td>{r.tradeId}</td>
                    <td>{r.lotId}</td>
                    <td>{r.openDate ?? ''}</td>
                    <td>{fmt(r.openPrice)}</td>
                    <td>{r.closeDate ?? ''}</td>
                    <td>{fmt(r.closePrice)}</td>
                    <td className="text-end">{fmt(r.quantity)}</td>
                    <td className="text-end">{fmt(r.longTermRpnl)}</td>
                    <td className="text-end">{fmt(r.shortTermRpnl)}</td>
                    <td className="text-end">{fmt(r.totalRpnl)}</td>
                  </tr>
                ))}

                <tr className="table-light fw-semibold">
                  <td colSpan={7}>Totals</td>
                  <td className="text-end">{fmt(totals.quantity)}</td>
                  <td className="text-end">{fmt(totals.longTermRpnl)}</td>
                  <td className="text-end">{fmt(totals.shortTermRpnl)}</td>
                  <td className="text-end">{fmt(totals.totalRpnl)}</td>
                </tr>
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}


// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import Cookies from 'js-cookie';
// import { Button, Modal, Table, Spinner } from 'react-bootstrap';
// import { Eye } from 'lucide-react';

// const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// function getAuthHeaders() {
//   const token = Cookies.get('dashboardToken');
//   const h = { Accept: 'application/json' };
//   if (token) h.Authorization = `Bearer ${token}`;
//   return h;
// }

// const fmt = (v) =>
//   Number(v || 0).toLocaleString('en-IN', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

// const fmtQty = (v) =>
//   Number(v || 0).toLocaleString('en-IN', {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   });

// export default function RPNLReportModal({
//   show,
//   handleClose,
//   fundId,
//   start,  // 'YYYY-MM-DD'
//   end,    // 'YYYY-MM-DD'
// }) {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState('');

//   // fetch realized PnL rows
//   useEffect(() => {
//     if (!show || !fundId || !start || !end) return;

//     (async () => {
//       try {
//         setLoading(true);
//         setErr('');

//         const params = new URLSearchParams();
//         params.set('start', start);
//         params.set('end', end);

//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(
//           fundId
//         )}/realized-pnl?${params.toString()}`;

//         const resp = await fetch(url, {
//           headers: getAuthHeaders(),
//           credentials: 'include',
//         });

//         let json = null;
//         try {
//           json = await resp.json();
//         } catch {}

//         if (!resp.ok) {
//           const msg = json?.error || json?.message || `HTTP ${resp.status}`;
//           setErr(msg);
//           setRows([]);
//           return;
//         }

//         setRows(Array.isArray(json?.rows) ? json.rows : []);
//       } catch (e) {
//         console.error('[RPNL] fetch failed', e);
//         setErr('Failed to load Realized P&L.');
//         setRows([]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [show, fundId, start, end]);

//   // derive long/short buckets + totals
//   const enhanced = useMemo(() => {
//     const addBuckets = (r) => {
//       const open = new Date(r.open_date || r.openDate || r.openDateTime || r.open);
//       const close = new Date(r.close_date || r.closeDate || r.closeDateTime || r.close);
//       const msDay = 24 * 60 * 60 * 1000;
//       const holdingDays = isFinite(open) && isFinite(close) ? Math.floor((close - open) / msDay) : 0;

//       const rpnl = Number(r.rpnl || r.totalRpnl || 0);
//       const long = holdingDays >= 365 ? rpnl : 0;
//       const shrt = holdingDays >= 365 ? 0 : rpnl;

//       return {
//         symbol: r.symbol,
//         tradeId: r.trade_id || r.tradeId,
//         lotId: r.lot_id || r.lotId,
//         openDate: (r.open_date || r.openDate || '').slice(0, 10),
//         openPrice: Number(r.lot_price ?? r.open_price ?? r.openPrice ?? 0),
//         closeDate: (r.close_date || r.closeDate || '').slice(0, 10),
//         closePrice: Number(r.current_price ?? r.close_price ?? r.closePrice ?? 0),
//         quantity: Number(r.quantity ?? 0),
//         longTermRpnl: long,
//         shortTermRpnl: shrt,
//         totalRpnl: rpnl,
//       };
//     };

//     const rows2 = rows.map(addBuckets);

//     const sum = (k) => rows2.reduce((s, x) => s + Number(x[k] || 0), 0);

//     return {
//       rows2,
//       totals: {
//         qty: rows2.reduce((s, x) => s + Number(x.quantity || 0), 0),
//         lt: sum('longTermRpnl'),
//         st: sum('shortTermRpnl'),
//         total: sum('totalRpnl'),
//       },
//     };
//   }, [rows]);

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={18} />
//           REALIZED P&L <span className="text-muted ms-2">{start} → {end}</span>
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         {err && <div className="text-danger mb-2">{err}</div>}

//         {loading ? (
//           <div className="d-flex align-items-center gap-2 text-muted">
//             <Spinner size="sm" /> Loading…
//           </div>
//         ) : (
//           <div className="table-responsive">
//             <Table bordered hover size="sm" className="align-middle">
//               <thead>
//                 <tr>
//                   <th>Symbol</th>
//                   <th>Trade ID</th>
//                   <th>Lot ID</th>
//                   <th>Open Date</th>
//                   <th className="text-end">Open Price</th>
//                   <th>Close Date</th>
//                   <th className="text-end">Close Price</th>
//                   <th className="text-end">Quantity</th>
//                   <th className="text-end">Long Term RPNL</th>
//                   <th className="text-end">Short Term RPNL</th>
//                   <th className="text-end">Total RPNL</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {enhanced.rows2.map((r, i) => (
//                   <tr key={i}>
//                     <td>{r.symbol}</td>
//                     <td>{r.tradeId}</td>
//                     <td>{r.lotId}</td>
//                     <td>{r.openDate}</td>
//                     <td className="text-end">{fmt(r.openPrice)}</td>
//                     <td>{r.closeDate}</td>
//                     <td className="text-end">{fmt(r.closePrice)}</td>
//                     <td className="text-end">{fmtQty(r.quantity)}</td>
//                     <td className="text-end">{fmt(r.longTermRpnl)}</td>
//                     <td className="text-end">{fmt(r.shortTermRpnl)}</td>
//                     <td className="text-end fw-semibold">{fmt(r.totalRpnl)}</td>
//                   </tr>
//                 ))}

//                 <tr className="table-light fw-bold">
//                   <td colSpan={7}>Totals</td>
//                   <td className="text-end">{fmtQty(enhanced.totals.qty)}</td>
//                   <td className="text-end">{fmt(enhanced.totals.lt)}</td>
//                   <td className="text-end">{fmt(enhanced.totals.st)}</td>
//                   <td className="text-end">{fmt(enhanced.totals.total)}</td>
//                 </tr>
//               </tbody>
//             </Table>
//           </div>
//         )}
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={handleClose}>Close</Button>
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

// const RPNLReportModal = ({ show, handleClose }) => {
//   const columnDefs = [
//     { headerName: 'Symbol', field: 'symbol', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Trade ID', field: 'tradeId', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Lot ID', field: 'lotId', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Open Date', field: 'openDate', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Open Price', field: 'openPrice', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Close Date', field: 'closeDate', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Close Price', field: 'closePrice', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Quantity', field: 'quantity', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Long Term RPNL', field: 'longTermRpnl', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Short Term RPNL', field: 'shortTermRpnl', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Total RPNL', field: 'totalRpnl', sortable: true, filter: true, flex: 1 },
//   ];

//   const rowData = [
//     { symbol: 'AAPL', tradeId: 'T001', lotId: 'L001', openDate: '2024-01-10', openPrice: 150, closeDate: '2024-01-20', closePrice: 155, quantity: 100, longTermRpnl: 300, shortTermRpnl: 200, totalRpnl: 500 },
//     { symbol: 'GOOGL', tradeId: 'T002', lotId: 'L002', openDate: '2024-02-15', openPrice: 2800, closeDate: '2024-02-25', closePrice: 2850, quantity: 50, longTermRpnl: 1500, shortTermRpnl: 1000, totalRpnl: 2500 },
//   ];

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> RPNL Report
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

// export default RPNLReportModal;
