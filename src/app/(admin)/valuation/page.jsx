'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Modal, Row, Button } from 'react-bootstrap';
import { Eye, RotateCcw } from 'lucide-react';

// Toggle (upload/manual)
const ToggleBetweenModals = dynamic(
  () => import('@/app/(admin)/base-ui/modals/components/AllModals').then((m) => m.ToggleBetweenModals),
  { ssr: false }
);

// AgGrid
const AgGridReact = dynamic(() => import('ag-grid-react').then((m) => m.AgGridReact), { ssr: false });

const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken');
  const h = { Accept: 'application/json' }; // <-- no TypeScript here
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// --- React cell renderer for the Actions column ---
function ActionsRenderer(props) {
  const { data, context } = props;
  const isCompleted = String(data?.status || '').toLowerCase() === 'completed';
  if (!isCompleted) return <>—</>;

  const isLatestCompleted =
    !!context?.latestCompletedDate && data?.date === context.latestCompletedDate;

  return (
    <div className="d-inline-flex align-items-center gap-2">
      <Eye
        size={18}
        className="text-primary cursor-pointer"
        title="View Symbols"
        onClick={() => context?.handleViewSymbols?.(data)}
      />
      {isLatestCompleted ? (
        <RotateCcw
          size={18}
          className="text-primary cursor-pointer"
          title="Revert Valuation"
          onClick={() => context?.handleRevert?.(data)}
        />
      ) : null}
    </div>
  );
}

function getFundIdFromCookie() {
  try {
    const cookie = document.cookie.split('; ').find((c) => c.startsWith('dashboardToken='));
    if (!cookie) return null;
    const token = cookie.split('=')[1];
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload?.fund_id || payload?.fundId || payload?.fund?.fund_id || null;
  } catch {
    return null;
  }
}

export default function ReviewsPage() {
  const [fundId, setFundId] = useState(null);

  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // latest completed period (YYYY-MM-DD) for showing revert icon
  const latestCompletedDateRef = useRef(null);

  // symbols modal
  const [showModal, setShowModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [symbolRows, setSymbolRows] = useState([]);
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [symbolErr, setSymbolErr] = useState('');

  // set up columns once
  useEffect(() => {
    (async () => {
      try {
        const mod = await import('@/assets/tychiData/columnDefs').catch(() => null);
        const base =
          mod?.pricingColDefs ||
          [
            { headerName: 'Sr.No', field: 'srNo', width: 90 },
            { headerName: 'Reporting Period', field: 'month', flex: 1 },
            { headerName: 'Reporting Date', field: 'date', width: 160 },
            { headerName: 'Status', field: 'status', width: 130 },
          ];

        setColumnDefs([
          ...base,
          {
            headerName: 'View Symbols',
            field: 'view',
            width: 150,
            sortable: false,
            filter: false,
            cellRenderer: 'ActionsRenderer', // register below
          },
        ]);
      } catch (e) {
        console.error('[Valuation] columnDefs error', e);
      }
    })();

    // AG Grid community modules (fixes row model module error)
    import('ag-grid-community')
      .then(({ ModuleRegistry, AllCommunityModule }) => {
        ModuleRegistry.registerModules([AllCommunityModule]);
      })
      .catch(() => {});
  }, []);

  // get fund id from cookie once on mount
  useEffect(() => {
    setFundId(getFundIdFromCookie());
  }, []);

  // fetch reporting periods when fundId exists
  useEffect(() => {
    if (!fundId) return;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods?limit=200`;
        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json(); // { rows, count }
        const rows = (json?.rows || []).map((r, i) => ({
          srNo: i + 1,
          month: r.period_name || '-',           // e.g. "July (1–31)"
          date: (r.end_date || '').slice(0, 10), // end_date is the pricing date
          status: String(r.status || 'completed').toLowerCase(),
          raw: r,
        }));

        // compute latest completed date (ISO string)
        const latestCompleted =
          rows
            .filter((it) => (it.status || '').toLowerCase() === 'completed' && it.date)
            .map((it) => it.date)
            .sort()
            .pop() || null;
        latestCompletedDateRef.current = latestCompleted;

        setRowData(rows);
      } catch (e) {
        console.error('[Valuation] load periods failed:', e);
        setErr('Failed to load reporting periods.');
      } finally {
        setLoading(false);
      }
    })();
  }, [fundId]);

  async function handleViewSymbols(row) {
    if (!row || !fundId) return;
    setSelectedLabel(`${row.month} — ${row.date}`);
    setShowModal(true);
    setSymbolLoading(true);
    setSymbolErr('');
    setSymbolRows([]);
    try {
      const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(
        fundId
      )}/reporting-periods/symbols?date=${encodeURIComponent(row.date)}`;
      const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json(); // { rows }
      const rows = (json?.rows || []).map((r) => ({
        symbol: r.symbol_name || r.symbol_id,
        price: Number(r.price ?? 0),
      }));
      setSymbolRows(rows);
    } catch (e) {
      console.error('[Valuation] load symbols failed:', e);
      setSymbolErr('Failed to load symbols for this period.');
    } finally {
      setSymbolLoading(false);
    }
  }

  async function handleRevert(row) {
    if (!row || !fundId) return;

    // safety: only allow revert for the latest completed period
    const isAllowed =
      (row.status || '').toLowerCase() === 'completed' &&
      latestCompletedDateRef.current &&
      row.date === latestCompletedDateRef.current;

    if (!isAllowed) {
      alert('Only the latest completed period can be reverted.');
      return;
    }

    if (!confirm(`Revert valuation for ${row.month} — ${row.date}?`)) return;

    try {
      const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods/revert`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ date: row.date }),
      });

      const raw = await resp.text().catch(() => '');

      if (!resp.ok) {
        let message = `HTTP ${resp.status}`;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            message =
              (typeof parsed?.message === 'string' && parsed.message) ||
              (typeof parsed?.error === 'string' && parsed.error) ||
              message;
          } catch (_) {
            message = raw;
          }
        }
        throw new Error(message);
      }

      let parsed = null;
      if (raw) {
        try {
          parsed = JSON.parse(raw);
        } catch (_) {
          // ignore malformed JSON, treat as plain text success
        }
      }

      if (parsed && parsed.success === false) {
        const serverMessage =
          (typeof parsed.message === 'string' && parsed.message) ||
          (typeof parsed.error === 'string' && parsed.error) ||
          'Revert failed.';
        throw new Error(serverMessage);
      }

      // refresh UI: mark this row reverted and recompute "latest completed"
      setRowData((prev) => {
        const next = prev.map((r) => (r.date === row.date ? { ...r, status: 'reverted' } : r));
        const nextLatest =
          next
            .filter((it) => (it.status || '').toLowerCase() === 'completed' && it.date)
            .map((it) => it.date)
            .sort()
            .pop() || null;
        latestCompletedDateRef.current = nextLatest;
        return next;
      });

      alert('Reverted successfully.');
    } catch (e) {
      const message = e?.message || 'Revert failed.';
      console.error('[Valuation] revert failed:', e);
      alert(message);
    }
  }

  return (
    <>
      <Row>
        <Col xl={12}>
          <Card className="shadow-sm">
            <CardHeader className="d-flex justify-content-between align-items-center bg-light">
              <CardTitle as="h4">Valuation</CardTitle>
              <Dropdown>
                <ToggleBetweenModals apiBase={apiBase} />
              </Dropdown>
            </CardHeader>

            <CardBody className="p-2">
              {err && <div className="text-danger mb-2">{err}</div>}
              <div className="ag-theme-quartz">
                <AgGridReact
                  rowData={rowData}
                  columnDefs={columnDefs}
                  domLayout="autoHeight"
                  pagination
                  paginationPageSize={10}
                  defaultColDef={{ sortable: true, filter: true, resizable: true }}
                  overlayLoadingTemplate={
                    loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
                  }
                  context={{
                    handleViewSymbols,
                    handleRevert,
                    latestCompletedDate: latestCompletedDateRef.current,
                  }}
                  components={{ ActionsRenderer }}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* View Symbols Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Symbols & Prices — {selectedLabel}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {symbolLoading ? (
            <p className="text-muted">Loading…</p>
          ) : symbolErr ? (
            <p className="text-danger">{symbolErr}</p>
          ) : symbolRows.length ? (
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-light">
                  <tr>
                    <th className="text-start">Symbol</th>
                    <th className="text-end">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {symbolRows.map((it, i) => (
                    <tr key={i}>
                      <td>{it.symbol}</td>
                      <td className="text-end">{it.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center">No symbols available for this period.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}


// 'use client';

// import dynamic from 'next/dynamic';
// import { useEffect, useRef, useState } from 'react';
// import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Modal, Row, Button } from 'react-bootstrap';
// import { Eye, RotateCcw } from 'lucide-react';

// // Toggle (upload/manual)
// const ToggleBetweenModals = dynamic(
//   () => import('@/app/(admin)/base-ui/modals/components/AllModals').then((m) => m.ToggleBetweenModals),
//   { ssr: false }
// );

// // AgGrid
// const AgGridReact = dynamic(() => import('ag-grid-react').then((m) => m.AgGridReact), { ssr: false });

// const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// // ---- helpers ----
// function getFundIdFromCookie() {
//   try {
//     const cookie = document.cookie.split('; ').find((c) => c.startsWith('dashboardToken='));
//     if (!cookie) return null;
//     const token = cookie.split('=')[1];
//     const payload = JSON.parse(atob(token.split('.')[1] || ''));
//     return payload?.fund_id || payload?.fundId || payload?.fund?.fund_id || null;
//   } catch {
//     return null;
//   }
// }

// export default function ReviewsPage() {
//   const [fundId, setFundId] = useState(null);

//   const [rowData, setRowData] = useState([]);
//   const [columnDefs, setColumnDefs] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState('');

//   // latest completed period (YYYY-MM-DD) for showing revert icon
//   const latestCompletedDateRef = useRef(null);

//   // view symbols modal
//   const [showModal, setShowModal] = useState(false);
//   const [selectedLabel, setSelectedLabel] = useState('');
//   const [symbolRows, setSymbolRows] = useState([]);
//   const [symbolLoading, setSymbolLoading] = useState(false);
//   const [symbolErr, setSymbolErr] = useState('');

//   // column defs (use your defs if available, else fallback)
//   useEffect(() => {
//     (async () => {
//       try {
//         const mod = await import('@/assets/tychiData/columnDefs').catch(() => null);
//         const base =
//           mod?.pricingColDefs ||
//           [
//             { headerName: 'Sr.No', field: 'srNo', width: 90 },
//             { headerName: 'Reporting Period', field: 'month', flex: 1 },
//             { headerName: 'Reporting Date', field: 'date', width: 160 },
//             { headerName: 'Status', field: 'status', width: 130 },
//           ];

//         setColumnDefs([
//           ...base,
//           {
//             headerName: 'View Symbols',
//             field: 'view',
//             width: 130,
//             sortable: false,
//             filter: false,
//             cellRenderer: (p) => {
//               const isCompleted = (p.data?.status || '').toLowerCase() === 'completed';
//               if (!isCompleted) return '—';

//               const isLatestCompleted =
//                 !!latestCompletedDateRef.current && p.data?.date === latestCompletedDateRef.current;

//               return (
//                 <div className="d-inline-flex align-items-center gap-2">
//                   <Eye
//                     size={18}
//                     className="text-primary cursor-pointer"
//                     title="View Symbols"
//                     onClick={() => handleViewSymbols(p.data)}
//                   />
//                   {isLatestCompleted ? (
//                     <RotateCcw
//                       size={18}
//                       className="text-primary cursor-pointer"
//                       title="Revert Valuation"
//                       onClick={() => handleRevert(p.data)}
//                     />
//                   ) : null}
//                 </div>
//               );
//             },
//           },
//         ]);
//       } catch (e) {
//         console.error('[Valuation] columnDefs error', e);
//       }
//     })();

//     // AgGrid community modules (AG Grid v33+)
//     import('ag-grid-community')
//       .then(({ ModuleRegistry, AllCommunityModule }) => {
//         ModuleRegistry.registerModules([AllCommunityModule]);
//       })
//       .catch(() => {});
//   }, []);

//   // get fund id from cookie once on mount
//   useEffect(() => {
//     setFundId(getFundIdFromCookie());
//   }, []);

//   // fetch reporting periods when fundId exists
//   useEffect(() => {
//     if (!fundId) return;
//     (async () => {
//       setLoading(true);
//       setErr('');
//       try {
//         const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods?limit=200`;
//         const resp = await fetch(url, { headers: { Accept: 'application/json' } });
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//         const json = await resp.json(); // { rows, count }
//         const rows = (json?.rows || []).map((r, i) => ({
//           srNo: i + 1,
//           month: r.period_name || '-',           // e.g. "July (1–31)"
//           date: (r.end_date || '').slice(0, 10), // use end_date as the pricing date
//           status: (r.status || 'completed').toLowerCase(),
//           raw: r,
//         }));

//         // compute latest completed date (ISO string)
//         const latestCompleted =
//           rows
//             .filter((it) => (it.status || '').toLowerCase() === 'completed' && it.date)
//             .map((it) => it.date)
//             .sort()
//             .pop() || null;
//         latestCompletedDateRef.current = latestCompleted;

//         setRowData(rows);
//       } catch (e) {
//         console.error('[Valuation] load periods failed:', e);
//         setErr('Failed to load reporting periods.');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [fundId]);

//   async function handleViewSymbols(row) {
//     if (!row || !fundId) return;
//     setSelectedLabel(`${row.month} — ${row.date}`);
//     setShowModal(true);
//     setSymbolLoading(true);
//     setSymbolErr('');
//     setSymbolRows([]);

//     try {
//       const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods/symbols?date=${encodeURIComponent(
//         row.date
//       )}`;
//       const resp = await fetch(url, { headers: { Accept: 'application/json' } });
//       if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//       const json = await resp.json(); // { rows }
//       const rows = (json?.rows || []).map((r) => ({
//         symbol: r.symbol_name || r.symbol_id,
//         price: Number(r.price ?? 0),
//       }));
//       setSymbolRows(rows);
//     } catch (e) {
//       console.error('[Valuation] load symbols failed:', e);
//       setSymbolErr('Failed to load symbols for this period.');
//     } finally {
//       setSymbolLoading(false);
//     }
//   }

//   async function handleRevert(row) {
//     if (!row || !fundId) return;

//     // safety: only allow revert for the latest completed period
//     const isAllowed =
//       (row.status || '').toLowerCase() === 'completed' &&
//       latestCompletedDateRef.current &&
//       row.date === latestCompletedDateRef.current;

//     if (!isAllowed) {
//       alert('Only the latest completed period can be reverted.');
//       return;
//     }

//     if (!confirm(`Revert valuation for ${row.month} — ${row.date}?`)) return;

//     try {
//       const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods/revert`;
//       const resp = await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
//         body: JSON.stringify({ date: row.date }), // or { end_date: row.date }
//       });
//       if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

//       // refresh UI: mark this row reverted and recompute latest completed
//       setRowData((prev) => {
//         const next = prev.map((r) => (r.date === row.date ? { ...r, status: 'reverted' } : r));
//         const nextLatest =
//           next
//             .filter((it) => (it.status || '').toLowerCase() === 'completed' && it.date)
//             .map((it) => it.date)
//             .sort()
//             .pop() || null;
//         latestCompletedDateRef.current = nextLatest;
//         return next;
//       });
//     } catch (e) {
//       console.error('[Valuation] revert failed:', e);
//       alert('Revert failed.');
//     }
//   }

//   return (
//     <>
//       <Row>
//         <Col xl={12}>
//           <Card className="shadow-sm">
//             <CardHeader className="d-flex justify-content-between align-items-center bg-light">
//               <CardTitle as="h4">Valuation</CardTitle>
//               <Dropdown>
//                 <ToggleBetweenModals apiBase={apiBase} />
//               </Dropdown>
//             </CardHeader>

//             <CardBody className="p-2">
//               {err && <div className="text-danger mb-2">{err}</div>}
//               <div className="ag-theme-quartz">
//                 <AgGridReact
//                   rowData={rowData}
//                   columnDefs={columnDefs}
//                   domLayout="autoHeight"
//                   pagination
//                   paginationPageSize={10}
//                   defaultColDef={{ sortable: true, filter: true, resizable: true }}
//                   overlayLoadingTemplate={
//                     loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
//                   }
//                 />
//               </div>
//             </CardBody>
//           </Card>
//         </Col>
//       </Row>

//       {/* View Symbols Modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Symbols & Prices — {selectedLabel}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {symbolLoading ? (
//             <p className="text-muted">Loading…</p>
//           ) : symbolErr ? (
//             <p className="text-danger">{symbolErr}</p>
//           ) : symbolRows.length ? (
//             <div className="table-responsive">
//               <table className="table table-bordered table-striped">
//                 <thead className="table-light">
//                   <tr>
//                     <th className="text-start">Symbol</th>
//                     <th className="text-end">Price</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {symbolRows.map((it, i) => (
//                     <tr key={i}>
//                       <td>{it.symbol}</td>
//                       <td className="text-end">{it.price}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <p className="text-muted text-center">No symbols available for this period.</p>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowModal(false)}>
//             Close
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </>
//   );
// }

// 'use client';

// import dynamic from 'next/dynamic';
// import { useEffect, useMemo, useState } from 'react';
// import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Modal, Row, Button } from 'react-bootstrap';
// import { Eye, RotateCcw } from 'lucide-react';

// // Toggle (upload/manual)
// const ToggleBetweenModals = dynamic(
//   () => import('@/app/(admin)/base-ui/modals/components/AllModals').then(m => m.ToggleBetweenModals),
//   { ssr: false }
// );

// // AgGrid
// const AgGridReact = dynamic(() => import('ag-grid-react').then(m => m.AgGridReact), { ssr: false });

// const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// // ---- helpers ----
// function getFundIdFromCookie() {
//   try {
//     const cookie = document.cookie.split('; ').find(c => c.startsWith('dashboardToken='));
//     if (!cookie) return null;
//     const token = cookie.split('=')[1];
//     const payload = JSON.parse(atob(token.split('.')[1] || ''));
//     return payload?.fund_id || payload?.fundId || payload?.fund?.fund_id || null;
//   } catch {
//     return null;
//   }
// }

// export default function ReviewsPage() {
//   const [fundId, setFundId] = useState(null);

//   const [rowData, setRowData] = useState([]);
//   const [columnDefs, setColumnDefs] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState('');

//   // view symbols modal
//   const [showModal, setShowModal] = useState(false);
//   const [selectedLabel, setSelectedLabel] = useState('');
//   const [symbolRows, setSymbolRows] = useState([]);
//   const [symbolLoading, setSymbolLoading] = useState(false);
//   const [symbolErr, setSymbolErr] = useState('');

//   // column defs (use your defs if available, else fallback)
//   useEffect(() => {
//     (async () => {
//       try {
//         const mod = await import('@/assets/tychiData/columnDefs').catch(() => null);
//         const base = (mod?.pricingColDefs || [
//           { headerName: 'Sr No', field: 'srNo', width: 90 },
//           { headerName: 'Month', field: 'month', flex: 1 },
//           { headerName: 'Period End Date', field: 'date', width: 160 },
//           { headerName: 'Status', field: 'status', width: 130 },
//         ]);

//         setColumnDefs([
//           ...base,
//           {
//             headerName: 'View Symbols',
//             field: 'view',
//             width: 130,
//             sortable: false,
//             filter: false,
//              cellRenderer: (p) =>
//                p.data?.status?.toLowerCase() === 'completed' ? (
//                  <div className="d-inline-flex align-items-center gap-2">
//                    <Eye
//                      size={18}
//                      className="text-primary cursor-pointer"
//                      title="View Symbols"
//                      onClick={() => handleViewSymbols(p.data)}
//                    />
//                    <RotateCcw
//                      size={18}
//                      className="text-primary cursor-pointer"
//                      title="Revert Valuation"
//                      onClick={() => handleRevert(p.data)}
//                    />
//                  </div>
//                ) : '—',
//           },
//         ]);
//       } catch (e) {
//         console.error('[Valuation] columnDefs error', e);
//       }
//     })();

//     // AgGrid community modules (optional)
//     import('ag-grid-community')
//       .then(({ ModuleRegistry, AllCommunityModule }) => {
//         ModuleRegistry.registerModules([AllCommunityModule]);
//       })
//       .catch(() => {});
//   }, []);

//   // get fund id from cookie once on mount
//   useEffect(() => {
//     setFundId(getFundIdFromCookie());
//   }, []);

//   // fetch reporting periods when fundId exists
//   useEffect(() => {
//     if (!fundId) return;
//     (async () => {
//       setLoading(true);
//       setErr('');
//       try {
//         const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods?limit=200`;
//         const resp = await fetch(url, { headers: { Accept: 'application/json' } });
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//         const json = await resp.json(); // { rows, count }
//         const rows = (json?.rows || []).map((r, i) => ({
//           srNo: i + 1,
//           month: r.period_name || '-',                // e.g. "July (1–31)"
//           date: (r.end_date || '').slice(0, 10),      // use end_date as the pricing date
//           status: r.status || 'Completed',
//           raw: r,
//         }));
//         setRowData(rows);
//       } catch (e) {
//         console.error('[Valuation] load periods failed:', e);
//         setErr('Failed to load reporting periods.');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [fundId]);

//   async function handleViewSymbols(row) {
//     if (!row || !fundId) return;
//     setSelectedLabel(`${row.month} — ${row.date}`);
//     setShowModal(true);
//     setSymbolLoading(true);
//     setSymbolErr('');
//     setSymbolRows([]);
//     try {
//       const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods/symbols?date=${encodeURIComponent(row.date)}`;
//       const resp = await fetch(url, { headers: { Accept: 'application/json' } });
//       if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//       const json = await resp.json(); // { rows }
//       const rows = (json?.rows || []).map((r) => ({
//         symbol: r.symbol_name || r.symbol_id,
//         price: Number(r.price ?? 0),
//       }));
//       setSymbolRows(rows);
//     } catch (e) {
//       console.error('[Valuation] load symbols failed:', e);
//       setSymbolErr('Failed to load symbols for this period.');
//     } finally {
//       setSymbolLoading(false);
//     }
//   }
//   async function handleRevert(row) {
//     if (!row || !fundId) return;
//     if (!confirm(`Revert valuation for ${row.month} — ${row.date}?`)) return;

//     try {
//       // adjust to your actual API when you build it:
//       const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods/revert`;
//       const resp = await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
//         body: JSON.stringify({ date: row.date }) // or { end_date: row.date }
//       });
//       if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//       // refresh the list after revert
//       setRowData((prev) =>
//         prev.map((r) => (r.date === row.date ? { ...r, status: 'reverted' } : r))
//       );
//     } catch (e) {
//       console.error('[Valuation] revert failed:', e);
//       alert('Revert failed.');
//     }
//   }
//   return (
//     <>
//       <Row>
//         <Col xl={12}>
//           <Card className="shadow-sm">
//             <CardHeader className="d-flex justify-content-between align-items-center bg-light">
//               <CardTitle as="h4">Valuation</CardTitle>
//               <Dropdown>
//                 <ToggleBetweenModals apiBase={apiBase} />
//               </Dropdown>
//             </CardHeader>

//             <CardBody className="p-2">
//               {err && <div className="text-danger mb-2">{err}</div>}
//               <div className="ag-theme-quartz">
//                 <AgGridReact
//                   rowData={rowData}
//                   columnDefs={columnDefs}
//                   domLayout="autoHeight"
//                   pagination
//                   paginationPageSize={10}
//                   defaultColDef={{ sortable: true, filter: true, resizable: true }}
//                   overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined}
//                 />
//               </div>
//             </CardBody>
//           </Card>
//         </Col>
//       </Row>

//       {/* View Symbols Modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Symbols & Prices — {selectedLabel}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {symbolLoading ? (
//             <p className="text-muted">Loading…</p>
//           ) : symbolErr ? (
//             <p className="text-danger">{symbolErr}</p>
//           ) : symbolRows.length ? (
//             <div className="table-responsive">
//               <table className="table table-bordered table-striped">
//                 <thead className="table-light">
//                   <tr>
//                     <th className="text-start">Symbol</th>
//                     <th className="text-end">Price</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {symbolRows.map((it, i) => (
//                     <tr key={i}>
//                       <td>{it.symbol}</td>
//                       <td className="text-end">{it.price}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <p className="text-muted text-center">No symbols available for this period.</p>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
//         </Modal.Footer>
//       </Modal>
//     </>
//   );
// }


// 'use client';

// import dynamic from 'next/dynamic';
// import { useEffect, useState } from 'react';
// import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Modal, Row, Button } from 'react-bootstrap';
// import { Eye } from 'lucide-react';

// // toggle modal (upload/manual)
// const ToggleBetweenModals = dynamic(
//   () => import('@/app/(admin)/base-ui/modals/components/AllModals').then(m => m.ToggleBetweenModals),
//   { ssr: false }
// );

// // AgGrid
// const AgGridReact = dynamic(() => import('ag-grid-react').then(m => m.AgGridReact), { ssr: false });

// const ReviewsPage = () => {
//   const [rowData, setRowData] = useState([]);
//   const [columnDefs, setColumnDefs] = useState([]);
//   const [selectedMonth, setSelectedMonth] = useState(null);
//   const [showModal, setShowModal] = useState(false);

//   // sample symbols for the view modal (objects with symbol+price)
//   const [symbolData, setSymbolData] = useState({
//     January:  [{ symbol: 'AAPL', price: 101.23 }, { symbol: 'GOOGL', price: 202.34 }],
//     February: [{ symbol: 'AMZN', price: 111.11 }, { symbol: 'NFLX',  price: 222.22 }],
//     March:    [{ symbol: 'IBM',  price: 444.44 }, { symbol: 'ORCL',  price: 555.55 }],
//   });

//   useEffect(() => {
//     console.log('[PAGE] mount Valuation');

//     if (typeof window !== 'undefined') {
//       import('@/assets/tychiData/columnDefs')
//         .then((defs) => {
//           console.log('[PAGE] columnDefs loaded', defs?.pricingColDefs?.length);
//           setColumnDefs([
//             ...(defs?.pricingColDefs || []),
//             {
//               headerName: 'View Symbols',
//               field: 'status',
//               width: 110,
//               sortable: false,
//               filter: false,
//               cellRenderer: (params) =>
//                 params.value === 'Completed' ? (
//                   <Eye
//                     size={18}
//                     className="text-primary cursor-pointer"
//                     title="View Symbols"
//                     onClick={() => handleViewSymbols(params.data.month)}
//                   />
//                 ) : '—',
//             },
//           ]);
//         })
//         .catch((err) => console.error('[PAGE] columnDefs error', err));

//       // table rows
//       const rows = [
//         { srNo: 1, month: 'January',  date: '2025-01-31', status: 'Completed' },
//         { srNo: 2, month: 'February', date: '2025-02-28', status: 'Completed' },
//         { srNo: 3, month: 'March',    date: '2025-03-31', status: 'Completed' },
//       ];
//       console.log('[PAGE] setRowData', rows);
//       setRowData(rows);

//       // ag-grid modules
//       import('ag-grid-community')
//         .then(({ ModuleRegistry, AllCommunityModule }) => {
//           console.log('[PAGE] register AgGrid modules');
//           ModuleRegistry.registerModules([AllCommunityModule]);
//         })
//         .catch((e) => console.error('[PAGE] AgGrid modules error', e));
//     }
//   }, []);

//   const handleViewSymbols = (month) => {
//     console.log('[PAGE] view symbols →', month);
//     setSelectedMonth(month);
//     setShowModal(true);
//   };

//   // optional: pass IDs down (if you already have them in context)
//   const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

//   return (
//     <>
//       <Row>
//         <Col xl={12}>
//           <Card className="shadow-sm">
//             <CardHeader className="d-flex justify-content-between align-items-center bg-light">
//               <CardTitle as="h4">Valuation</CardTitle>
//               <Dropdown>
//                 {/* pass apiBase; fund/org will auto-resolve in modal via storage/JWT */}
//                 <ToggleBetweenModals apiBase={apiBase} />
//               </Dropdown>
//             </CardHeader>
//             <CardBody className="p-2">
//               {columnDefs.length > 0 && (
//                 <AgGridReact
//                   rowData={rowData}
//                   columnDefs={columnDefs}
//                   domLayout="autoHeight"
//                   pagination
//                   paginationPageSize={10}
//                   defaultColDef={{ sortable: true, filter: true }}
//                 />
//               )}
//             </CardBody>
//           </Card>
//         </Col>
//       </Row>

//       {/* View Symbols Modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Symbols & Prices for {selectedMonth}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {symbolData[selectedMonth]?.length ? (
//             <div className="table-responsive">
//               <table className="table table-bordered table-striped">
//                 <thead className="table-light">
//                   <tr><th className="text-start">Symbol</th><th className="text-end">Price</th></tr>
//                 </thead>
//                 <tbody>
//                   {symbolData[selectedMonth].map((it, i) => (
//                     <tr key={i}>
//                       <td>{it.symbol}</td>
//                       <td className="text-end">${it.price}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : <p className="text-muted text-center">No symbols available for this month.</p>}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
//         </Modal.Footer>
//       </Modal>
//     </>
//   );
// };

// export default ReviewsPage;


// 'use client'; // ✅ Ensures this is a Client Component

// import dynamic from 'next/dynamic';
// import { useEffect, useState } from 'react';
// import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Modal, Row, Button } from 'react-bootstrap';
// import { Eye } from 'lucide-react';

// // ✅ Dynamically import ToggleBetweenModals to avoid SSR issues
// const ToggleBetweenModals = dynamic(() => 
//   import('@/app/(admin)/base-ui/modals/components/AllModals').then(mod => mod.ToggleBetweenModals), 
//   { ssr: false }
// );

// // ✅ Dynamically import AgGridReact to prevent SSR issues
// const AgGridReact = dynamic(() => 
//   import('ag-grid-react').then(mod => mod.AgGridReact), 
//   { ssr: false }
// );

// const ReviewsPage = () => {
//   const [rowData, setRowData] = useState([]);
//   const [columnDefs, setColumnDefs] = useState([]);
//   const [selectedMonth, setSelectedMonth] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [symbolData, setSymbolData] = useState({});

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       // ✅ Dynamically import column definitions safely
//       import('@/assets/tychiData/columnDefs')
//         .then((colmdefs) => {
//           setColumnDefs([
//             ...colmdefs.pricingColDefs,
//             {
//               headerName: 'View Symbols',
//               field: 'status',
//               cellRenderer: (params) =>
//                 params.value === 'Completed' ? (
//                   <Eye
//                     size={18}
//                     className="text-primary cursor-pointer"
//                     onClick={() => handleViewSymbols(params.data.month)}
//                     title="View Symbols"
//                   />
//                 ) : (
//                   '—'
//                 ),
//               width: 80,
//               sortable: false,
//               filter: false,
//             },
//           ]);
//         })
//         .catch((error) => {
//           console.error('Error loading columnDefs:', error);
//           setColumnDefs([]);
//         });

//       // ✅ Set row data
//       setRowData([
//         { srNo: 1, month: 'January', date: '2025-01-31', status: 'Completed' },
//         { srNo: 2, month: 'February', date: '2025-02-28', status: 'Completed' },
//         { srNo: 3, month: 'March', date: '2025-03-31', status: 'Completed' },
//       ]);

//       // ✅ Set Symbol Data (Sequential Order)
//       setSymbolData({
//         January: ['AAPL', 'GOOGL', 'TSLA', 'MSFT'],
//         February: ['AMZN', 'NFLX', 'META'],
//         March: ['IBM', 'ORCL', 'ADBE'],
//       });

//       // ✅ Dynamically import and register AgGrid Modules (fixes SSR issue)
//       import('ag-grid-community')
//         .then(({ ModuleRegistry, AllCommunityModule }) => {
//           ModuleRegistry.registerModules([AllCommunityModule]);
//         })
//         .catch((error) => console.error('Error registering AgGrid modules:', error));
//     }
//   }, []);

//   // Handle View Button Click
//   const handleViewSymbols = (month) => {
//     setSelectedMonth(month);
//     setShowModal(true);
//   };

//   return (
//     <>
//       <Row>
//         <Col xl={12}>
//           <Card className="shadow-sm">
//             <CardHeader className="d-flex justify-content-between align-items-center bg-light">
//               <CardTitle as="h4">Valuation</CardTitle>
//               <Dropdown>
//                 <ToggleBetweenModals />
//               </Dropdown>
//             </CardHeader>
//             <CardBody className="p-2">
//               <div>
//                 {columnDefs.length > 0 && (
//                   <AgGridReact
//                     rowData={rowData}
//                     columnDefs={columnDefs}
//                     domLayout="autoHeight"
//                     pagination
//                     paginationPageSize={10}
//                     defaultColDef={{ sortable: true, filter: true }}
//                   />
//                 )}
//               </div>
//             </CardBody>
//           </Card>
//         </Col>
//       </Row>

//      {/* Symbol List Modal */}
//      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Symbols & Prices for {selectedMonth}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {symbolData[selectedMonth]?.length > 0 ? (
//             <div className="table-responsive">
//               <table className="table table-bordered table-striped">
//                 <thead className="table-light">
//                   <tr>
//                     <th className="text-start">Symbol</th>
//                     <th className="text-end">Price</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {symbolData[selectedMonth].map((item, index) => (
//                     <tr key={index}>
//                       <td>{item.symbol}</td>
//                       <td className="text-end">${item.price}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <p className="text-muted text-center">No symbols available for this month.</p>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowModal(false)}>
//             Close
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </>
//   );
// };

// export default ReviewsPage;
