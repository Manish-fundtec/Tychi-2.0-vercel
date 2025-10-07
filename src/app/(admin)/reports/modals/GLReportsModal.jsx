// corrected 10/3/2025
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Cookies from 'js-cookie';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { ModuleRegistry } from 'ag-grid-community';
import { Eye } from 'lucide-react';

// ✅ Use full community module (v32+ safe)
import { AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

// ✅ Dynamically import AgGridReact to avoid SSR timing issues
const AgGridReact = dynamic(() => import('ag-grid-react').then(m => m.AgGridReact), { ssr: false });

const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken');
  const h = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

const fmt = (v) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function GLReportsModal({ show, handleClose, fundId, date }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [scope, setScope] = useState('MTD');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accLoading, setAccLoading] = useState(false);
  const [err, setErr] = useState('');

  const [pinnedTop, setPinnedTop] = useState([]);
  const [pinnedBottom, setPinnedBottom] = useState([]);
  const [gridApi, setGridApi] = useState(null);

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'S.no',
        width: 90,
        sortable: false,
        filter: false,
        valueGetter: (p) => (p.node.rowPinned ? '' : p.node.rowIndex + 1),
      },
      { headerName: 'Date', field: 'date', sortable: true, filter: true, flex: 1 },
      { headerName: 'Journal ID', field: 'journalid', sortable: true, filter: true, flex: 1 },
      { headerName: 'Account Name', field: 'accountname', sortable: true, filter: true, flex: 1 },
      { headerName: 'Description', field: 'description', sortable: true, filter: true, flex: 1 },
      {
        headerName: 'Dr Amount',
        field: 'dramount',
        sortable: true,
        filter: true,
        flex: 1,
        valueFormatter: (p) => (p.value == null ? '' : fmt(p.value)),
      },
      {
        headerName: 'Cr Amount',
        field: 'cramount',
        sortable: true,
        filter: true,
        flex: 1,
        valueFormatter: (p) => (p.value == null ? '' : fmt(p.value)),
      },
      {
        headerName: 'Running Balance',
        field: 'runningbalance',
        sortable: true,
        filter: true,
        flex: 1,
        valueFormatter: (p) => (p.value == null ? '' : fmt(p.value)),
      },
    ],
    []
  );

  // Load COA on open
  useEffect(() => {
    if (!show || !fundId) return;
    (async () => {
      try {
        setAccLoading(true);
        setErr('');
        const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/chart-of-accounts`;
        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        const list = (json?.rows || []).map((a) => ({
          gl_code: a.gl_code || a.account_code,
          account_name: a.account_name,
          label: a.label || `${a.gl_code || a.account_code} — ${a.account_name}`,
        }));
        const withAll = [{ gl_code: '', account_name: 'All Accounts', label: 'All Accounts' }, ...list];
        setAccounts(withAll);
        const keep = withAll.find((x) => x.gl_code === selectedAccount);
        setSelectedAccount(keep ? keep.gl_code : '');
      } catch (e) {
        console.error('[GLReportsModal] accounts load failed', e);
        setErr('Failed to load chart of accounts.');
        setAccounts([{ gl_code: '', account_name: 'All Accounts', label: 'All Accounts' }]);
        setSelectedAccount('');
      } finally {
        setAccLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, fundId]);

  // Load GL rows + compute pinned rows when filters change
  useEffect(() => {
    if (!show || !fundId || !date) return;
    (async () => {
      try {
        setLoading(true);
        setErr('');

        const params = new URLSearchParams();
        params.set('date', date);
        if (selectedAccount) params.set('account', selectedAccount);
        params.set('scope', String(scope).toUpperCase());

        const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl?${params.toString()}`;
        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const json = await resp.json();

        const mapped = (json?.rows || []).map((r) => ({
          date: r.date || date,
          journalid: r.journalid,
          accountname: r.accountname,
          description: r.description,
          dramount: Number(r.dramount ?? 0),
          cramount: Number(r.cramount ?? 0),
          runningbalance: r.runningbalance != null ? Number(r.runningbalance) : null,
        }));
        setRows(mapped);

        // Build pinned rows
        const opening = Number(json?.opening_balance ?? 0);
        const drTotal =
          Number(json?.totals?.dr_total ?? mapped.reduce((s, r) => s + (r.dramount || 0), 0));
        const crTotal =
          Number(json?.totals?.cr_total ?? mapped.reduce((s, r) => s + (r.cramount || 0), 0));

        let closing;
        if (selectedAccount) {
          const lastRB = mapped.length ? mapped[mapped.length - 1].runningbalance : opening;
          closing = lastRB == null ? opening + (drTotal - crTotal) : lastRB;
        } else {
          closing = opening + (drTotal - crTotal);
        }

        const top = [
          {
            date: null,
            journalid: null,
            accountname: 'Opening Balance',
            description: null,
            dramount: null,
            cramount: null,
            runningbalance: opening,
          },
        ];

        const bottom = [
          {
            date: null,
            journalid: null,
            accountname: 'Total',
            description: null,
            dramount: drTotal,
            cramount: crTotal,
            runningbalance: null,
          },
          {
            date: null,
            journalid: null,
            accountname: 'Closing Balance',
            description: null,
            dramount: null,
            cramount: null,
            runningbalance: closing,
          },
        ];

        setPinnedTop(top);
        setPinnedBottom(bottom);
      } catch (e) {
        console.error('[GLReportsModal] gl rows load failed', e);
        setErr('Failed to load journal entries.');
        setRows([]);
        setPinnedTop([]);
        setPinnedBottom([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, fundId, date, selectedAccount, scope]);

  // ✅ Ensure pinned rows are applied once grid is ready AND any time they change
  useEffect(() => {
    if (!gridApi) return;
    const anyApi = gridApi;
    if (typeof anyApi.setGridOption === 'function') {
      anyApi.setGridOption('pinnedTopRowData', pinnedTop);
      anyApi.setGridOption('pinnedBottomRowData', pinnedBottom);
    }
  }, [gridApi, pinnedTop, pinnedBottom]);

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={20} /> GL Report — <span className="text-muted">{date || '-'}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="mb-2">
          <Row className="g-3 align-items-end">
            <Col md={5}>
              <Form.Label>Select Chart Of Accounts</Form.Label>
              <Form.Select
                disabled={accLoading || accounts.length === 0}
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.gl_code || 'ALL'} value={a.gl_code}>
                    {a.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text muted>
                {selectedAccount ? `Filtering by ${selectedAccount}` : 'Showing all accounts'}
              </Form.Text>
            </Col>

            <Col md={5}>
              <Form.Label>Select Category</Form.Label>
              <Form.Select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="MTD">MTD</option>
                <option value="QTD">QTD</option>
                <option value="YTD">YTD</option>
              </Form.Select>
              <Form.Text muted>Period is computed from the selected date ({scope}).</Form.Text>
            </Col>

            <Col md={2} className="d-flex align-items-center justify-content-end">
              <Button variant="outline-secondary" size="sm" onClick={() => setSelectedAccount('')}>
                Show All
              </Button>
            </Col>
          </Row>
        </Form>

        {err && <div className="text-danger mb-2">{err}</div>}

        <div style={{ height: 460, width: '100%', minWidth: '900px' }}>
          <AgGridReact
            rowData={rows}
            columnDefs={columnDefs}
            rowModelType="clientSide"
            pagination
            paginationPageSize={10}
            defaultColDef={{ resizable: true }}
            overlayLoadingTemplate={
              loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
            }
            // Provide as props (so they show on client nav)…
            pinnedTopRowData={pinnedTop}
            pinnedBottomRowData={pinnedBottom}
            // …and re-apply once the grid is really ready (fixes full refresh)
            onGridReady={(params) => setGridApi(params.api)}
            onFirstDataRendered={(params) => {
              const api = params.api;
              if (typeof api.setGridOption === 'function') {
                api.setGridOption('pinnedTopRowData', pinnedTop);
                api.setGridOption('pinnedBottomRowData', pinnedBottom);
              }
            }}
          />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// export default GLReportsModal;

// 'use client'

// import { useEffect, useMemo, useState } from 'react';
// import Cookies from 'js-cookie';
// import { Button, Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
// import { AgGridReact } from 'ag-grid-react';
// import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
// import { Eye } from 'lucide-react';

// ModuleRegistry.registerModules([ClientSideRowModelModule]);

// const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// function getAuthHeaders() {
//   const token = Cookies.get('dashboardToken');
//   const h = { Accept: 'application/json' };
//   if (token) h.Authorization = `Bearer ${token}`;
//   return h;
// }

// // formatter
// const fmt = (v) =>
//   Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// const GLReportsModal = ({ show, handleClose, fundId, date }) => {
//   const [accounts, setAccounts] = useState([]);
//   const [selectedAccount, setSelectedAccount] = useState('');
//   const [scope, setScope] = useState('MTD');

//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [accLoading, setAccLoading] = useState(false);
//   const [err, setErr] = useState('');

//   // ✅ pinned rows
//   const [pinnedTop, setPinnedTop] = useState([]);
//   const [pinnedBottom, setPinnedBottom] = useState([]);

//   const columnDefs = useMemo(() => [
//     // ✅ S.No
//     {
//       headerName: 'S.no', width: 90, sortable: false, filter: false,
//       valueGetter: (p) => (p.node.rowPinned ? '' : p.node.rowIndex + 1),
//     },
//     { headerName: 'Date', field: 'date', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Journal ID', field: 'journalid', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Account Name', field: 'accountname', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Description', field: 'description', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Dr Amount', field: 'dramount', sortable: true, filter: true, flex: 1,
//       valueFormatter: p => (p.node?.rowPinned ? fmt(p.value) : fmt(p.value)) },
//     { headerName: 'Cr Amount', field: 'cramount', sortable: true, filter: true, flex: 1,
//       valueFormatter: p => (p.node?.rowPinned ? fmt(p.value) : fmt(p.value)) },
//     { headerName: 'Running Balance', field: 'runningbalance', sortable: true, filter: true, flex: 1,
//       valueFormatter: p => (p.value === null || p.value === undefined ? '' : fmt(p.value)) },
//   ], []);

//   // 1) Load Chart of Accounts
//   useEffect(() => {
//     if (!show || !fundId) return;
//     (async () => {
//       try {
//         setAccLoading(true); setErr('');
//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/chart-of-accounts`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//         const json = await resp.json();
//         const list = (json?.rows || []).map(a => ({
//           gl_code: a.gl_code || a.account_code,
//           account_name: a.account_name,
//           label: a.label || `${a.gl_code || a.account_code} — ${a.account_name}`,
//         }));
//         const withAll = [{ gl_code: '', account_name: 'All Accounts', label: 'All Accounts' }, ...list];
//         setAccounts(withAll);
//         const keep = withAll.find(x => x.gl_code === selectedAccount);
//         setSelectedAccount(keep ? keep.gl_code : '');
//       } catch (e) {
//         console.error('[GLReportsModal] accounts load failed', e);
//         setErr('Failed to load chart of accounts.');
//         setAccounts([{ gl_code: '', account_name: 'All Accounts', label: 'All Accounts' }]);
//         setSelectedAccount('');
//       } finally {
//         setAccLoading(false);
//       }
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [show, fundId]);

//   // 2) Load GL rows + opening/totals whenever deps change
//   useEffect(() => {
//     if (!show || !fundId || !date) return;
//     (async () => {
//       try {
//         setLoading(true); setErr('');

//         const params = new URLSearchParams();
//         params.set('date', date);
//         if (selectedAccount) params.set('account', selectedAccount);
//         if (scope) params.set('scope', String(scope).toUpperCase());   // ✅ normalize

//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl?${params.toString()}`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

//         const json = await resp.json();

//         // map rows
//         const mapped = (json?.rows || []).map(r => ({
//           date: r.date || date,
//           journalid: r.journalid,
//           accountname: r.accountname,
//           description: r.description,
//           dramount: Number(r.dramount ?? 0),
//           cramount: Number(r.cramount ?? 0),
//           runningbalance: r.runningbalance != null ? Number(r.runningbalance) : null,
//         }));
//         setRows(mapped);

//         // ✅ Opening Balance (pinned top)
//         const opening = Number(json?.opening_balance ?? 0);
//         setPinnedTop([{
//           date: '',
//           journalid: '',
//           accountname: 'Opening Balance',
//           description: '',
//           dramount: '',
//           cramount: '',
//           runningbalance: opening,
//         }]);

//         // ✅ Totals + Closing Balance (pinned bottom)
//         const drTotal = Number(json?.totals?.dr_total ?? 0);
//         const crTotal = Number(json?.totals?.cr_total ?? 0);
//         // const rbTotal = Number(json?.totals?.runningbalance ?? 0);

//         // If single account: prefer last row runningbalance for closing; else derive from OB + (Dr - Cr).
//         let closing;
//         if (selectedAccount) {
//           const lastRB = mapped.length ? mapped[mapped.length - 1].runningbalance : opening;
//           closing = (lastRB == null ? opening + (drTotal - crTotal) : lastRB);
//         } else {
//           // For "All Accounts" there is no running balance—show net effect vs OB=0.
//           closing = opening + (drTotal - crTotal);
//         }

//         setPinnedBottom([
//           {
//             date: '',
//             journalid: '',
//             accountname: 'Total',
//             description: '',
//             dramount: drTotal,
//             cramount: crTotal,
//             runningbalance: '',
//           },
//           {
//             date: '',
//             journalid: '',
//             accountname: 'Closing Balance',
//             description: '',
//             dramount: '',
//             cramount: '',
//             runningbalance: closing,
//           },
//         ]);
//       } catch (e) {
//         console.error('[GLReportsModal] gl rows load failed', e);
//         setErr('Failed to load journal entries.');
//         setRows([]); setPinnedTop([]); setPinnedBottom([]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [show, fundId, date, selectedAccount, scope]);

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> GL Report — <span className="text-muted">{date || '-'}</span>
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Form className="mb-2">
//           <Row className="g-3 align-items-end">
//             <Col md={5}>
//               <Form.Label>Select Chart Of Accounts</Form.Label>
//               <div className="d-flex gap-2">
//                 <Form.Select
//                   disabled={accLoading || accounts.length === 0}
//                   value={selectedAccount}
//                   onChange={(e) => setSelectedAccount(e.target.value)}
//                 >
//                   {accounts.map(a => (
//                     <option key={a.gl_code || 'ALL'} value={a.gl_code}>
//                       {a.label}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </div>
//               <Form.Text muted>
//                 {selectedAccount ? `Filtering by ${selectedAccount}` : 'Showing all accounts'}
//               </Form.Text>
//             </Col>

//             <Col md={5}>
//               <Form.Label>Select Category</Form.Label>
//               <Form.Select value={scope} onChange={(e) => setScope(e.target.value)}>
//                 <option value="MTD">MTD</option>
//                 <option value="QTD">QTD</option>
//                 <option value="YTD">YTD</option>
//               </Form.Select>
//               <Form.Text muted>Period is computed from the selected date ({scope}).</Form.Text>
//             </Col>

//             <Col md={2} className="d-flex align-items-center justify-content-end">
//               <Button variant="outline-secondary" size="sm" onClick={() => setSelectedAccount('')}>
//                 Show All
//               </Button>
//             </Col>
//           </Row>
//         </Form>

//         {err && <div className="text-danger mb-2">{err}</div>}

//         <div style={{ height: 460, width: '100%', minWidth: '900px' }}>
//           <AgGridReact
//             rowData={rows}
//             columnDefs={columnDefs}
//             rowModelType="clientSide"
//             pagination={true}
//             paginationPageSize={10}
//             overlayLoadingTemplate={
//               loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
//             }
//             // ✅ Show Opening/Totals/Closing as pinned
//             pinnedTopRowData={pinnedTop}
//             pinnedBottomRowData={pinnedBottom}
//           />
//         </div>
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={handleClose}>Close</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default GLReportsModal;

// 26/9/20225
// 'use client'

// import { useEffect, useMemo, useState } from 'react';
// import Cookies from 'js-cookie';
// import { Button, Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
// import { AgGridReact } from 'ag-grid-react';
// import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
// import { Eye } from 'lucide-react';

// ModuleRegistry.registerModules([ClientSideRowModelModule]);

// const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// function getAuthHeaders() {
//   const token = Cookies.get('dashboardToken');
//   const h = { Accept: 'application/json' };
//   if (token) h.Authorization = `Bearer ${token}`;
//   return h;
// }

// const GLReportsModal = ({ show, handleClose, fundId, date }) => {
//   const [accounts, setAccounts] = useState([]);            // [{ gl_code, account_name, label }]
//   const [selectedAccount, setSelectedAccount] = useState(''); // '' => all accounts
//   const [scope, setScope] = useState('MTD');               // 'MTD' | 'QTD' | 'YTD'

//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [accLoading, setAccLoading] = useState(false);
//   const [err, setErr] = useState('');

//   // // pinned rows
//   // const [pinnedTop, setPinnedTop] = useState([]);
//   // const [pinnedBottom, setPinnedBottom] = useState([]);

//   // const currencyFmt = (v) =>
//   //   (Number(v || 0)).toLocaleString(undefined /* or 'en-IN' */, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
//   const columnDefs = useMemo(() => [
//     { headerName: 'Date', field: 'date', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Journal ID', field: 'journalid', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Account Name', field: 'accountname', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Description', field: 'description', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Dr Amount', field: 'dramount', sortable: true, filter: true, flex: 1,
//       valueFormatter: p => (p.value ?? 0).toLocaleString() },
//     { headerName: 'Cr Amount', field: 'cramount', sortable: true, filter: true, flex: 1,
//       valueFormatter: p => (p.value ?? 0).toLocaleString() },
//     { headerName: 'Running Balance', field: 'runningbalance', sortable: true, filter: true, flex: 1,
//       valueFormatter: p => (p.value ?? 0).toLocaleString() },
//   ], []);

//   // 1) Load Chart of Accounts when modal opens (and fundId is known)
//   useEffect(() => {
//     if (!show || !fundId) return;

//     (async () => {
//       try {
//         setAccLoading(true);
//         setErr('');
//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/chart-of-accounts`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

//         const json = await resp.json();
//         const list = (json?.rows || []).map(a => ({
//           gl_code: a.gl_code || a.account_code,           // backend sends both (alias)
//           account_name: a.account_name,
//           label: a.label || `${a.gl_code || a.account_code} — ${a.account_name}`,
//         }));

//         // Add an "All Accounts" virtual option at the top
//         const withAll = [{ gl_code: '', account_name: 'All Accounts', label: 'All Accounts' }, ...list];

//         setAccounts(withAll);

//         // keep current selection if still present; else default to All
//         const keep = withAll.find(x => x.gl_code === selectedAccount);
//         setSelectedAccount(keep ? keep.gl_code : '');
//       } catch (e) {
//         console.error('[GLReportsModal] accounts load failed', e);
//         setErr('Failed to load chart of accounts.');
//         setAccounts([{ gl_code: '', account_name: 'All Accounts', label: 'All Accounts' }]);
//         setSelectedAccount('');
//       } finally {
//         setAccLoading(false);
//       }
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [show, fundId]);

//   // 2) Load GL rows whenever modal is open and deps change
//   useEffect(() => {
//     if (!show || !fundId || !date) return;

//     (async () => {
//       try {
//         setLoading(true);
//         setErr('');

//         const params = new URLSearchParams();
//         params.set('date', date);
//         if (selectedAccount) params.set('account', selectedAccount); // omit to fetch ALL
//         if (scope) params.set('scope', scope);

//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl?${params.toString()}`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });

//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

//         const json = await resp.json();
//         const mapped = (json?.rows || []).map(r => ({
//           date: r.date || date,
//           journalid: r.journalid,
//           accountname: r.accountname,
//           description: r.description,
//           dramount: Number(r.dramount ?? 0),
//           cramount: Number(r.cramount ?? 0),
//           runningbalance: r.runningbalance != null ? Number(r.runningbalance) : null,
//         }));

//         setRows(mapped);
//       } catch (e) {
//         console.error('[GLReportsModal] gl rows load failed', e);
//         setErr('Failed to load journal entries.');
//         setRows([]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [show, fundId, date, selectedAccount, scope]);

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> GL Report — <span className="text-muted">{date || '-'}</span>
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Form className="mb-2">
//           <Row className="g-3 align-items-end">
//             <Col md={5}>
//               <Form.Label>Select Chart Of Accounts</Form.Label>
//               <div className="d-flex gap-2">
//                 <Form.Select
//                   disabled={accLoading || accounts.length === 0}
//                   value={selectedAccount}
//                   onChange={(e) => setSelectedAccount(e.target.value)}
//                 >
//                   {accounts.map(a => (
//                     <option key={a.gl_code || 'ALL'} value={a.gl_code}>
//                       {a.label}
//                     </option>
//                   ))}
//                 </Form.Select>
               
//               </div>
//               <Form.Text muted>
//                 {selectedAccount ? `Filtering by ${selectedAccount}` : 'Showing all accounts'}
//               </Form.Text>
//             </Col>

//             <Col md={5}>
//               <Form.Label>Select Category</Form.Label>
//               <Form.Select value={scope} onChange={(e) => setScope(e.target.value)}>
//                 <option value="MTD">MTD</option>
//                 <option value="QTD">QTD</option>
//                 <option value="YTD">YTD</option>
//               </Form.Select>
//               <Form.Text muted>
//                 Period is computed from the selected date ({scope}).
//               </Form.Text> 
//             </Col>
//               <Col md={2}>
//               <Button
//                   variant="outline-secondary"
//                   size="sm"
//                   title="Show all accounts"
//                   onClick={() => setSelectedAccount('')}
//                 >
//                   Show All
//                 </Button>
//               </Col>

//             <Col md={2} className="d-flex align-items-center">
//               {loading || accLoading ? <Spinner animation="border" size="sm" className="ms-auto" /> : null}
//             </Col>
//           </Row>
//         </Form>

//         {err && <div className="text-danger mb-2">{err}</div>}

//         <div style={{ height: 420, width: '100%', minWidth: '900px' }}>
//           <AgGridReact
//             rowData={rows}
//             columnDefs={columnDefs}
//             rowModelType="clientSide"
//             pagination={true}
//             paginationPageSize={10}
//             overlayLoadingTemplate={
//               loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
//             }
//           />
//         </div>
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={handleClose}>Close</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default GLReportsModal;



// 25/9/2025
// 'use client'

// import { useEffect, useMemo, useState } from 'react';
// import Cookies from 'js-cookie';
// import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
// import { AgGridReact } from 'ag-grid-react';
// import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
// import { Eye } from 'lucide-react';

// ModuleRegistry.registerModules([ClientSideRowModelModule]);

// const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// function getAuthHeaders() {
//   const token = Cookies.get('dashboardToken');
//   const h = { Accept: 'application/json' };
//   if (token) h.Authorization = `Bearer ${token}`;
//   return h;
// }

// const GLReportsModal = ({ show, handleClose, fundId, date }) => {
//   const [accounts, setAccounts] = useState([]);            // [{gl_code, account_name, label}, ...]
//   const [selectedAccount, setSelectedAccount] = useState(''); // gl_code ('' => all)
//   const [scope, setScope] = useState('MTD');               // MTD | QTD | YTD

//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [accLoading, setAccLoading] = useState(false);

//   const columnDefs = useMemo(() => [
//     { headerName: 'Date', field: 'date', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Journal ID', field: 'journalid', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Account Name', field: 'accountname', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Description', field: 'description', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Dr Amount', field: 'dramount', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Cr Amount', field: 'cramount', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Running Balance', field: 'runningbalance', sortable: true, filter: true, flex: 1 },
//   ], []);

//   // 1) Load Chart of Accounts on open
//   useEffect(() => {
//     if (!show || !fundId) return;

//     (async () => {
//       try {
//         setAccLoading(true);
//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/chart-of-accounts`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

//         const json = await resp.json();
//         const list = (json?.rows || []).map(a => ({
//           gl_code: a.gl_code,                     // alias from backend
//           account_name: a.account_name,
//           label: a.label || `${a.gl_code} — ${a.account_name}`,
//         }));

//         setAccounts(list);

//         // keep current if present; else default to first
//         if (list.length) {
//           const keep = list.find(x => x.gl_code === selectedAccount);
//           setSelectedAccount(keep ? keep.gl_code : list[0].gl_code);
//         } else {
//           setSelectedAccount('');
//         }
//       } catch (e) {
//         console.error('[GLReportsModal] accounts load failed', e);
//         setAccounts([]);
//         setSelectedAccount('');
//       } finally {
//         setAccLoading(false);
//       }
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [show, fundId]);

//   // 2) Load GL rows when deps change
//   useEffect(() => {
//     if (!show || !fundId || !date) return;

//     (async () => {
//       try {
//         setLoading(true);
//         const params = new URLSearchParams();
//         params.set('date', date);
//         if (selectedAccount) params.set('account', selectedAccount); // omit => all accounts
//         if (scope) params.set('scope', scope);

//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl?${params.toString()}`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });

//         if (resp.ok) {
//           const json = await resp.json();
//           const mapped = (json?.rows || []).map(r => ({
//             date: r.date || date,
//             journalid: r.journalid,
//             accountname: r.accountname,
//             description: r.description,
//             dramount: Number(r.dramount ?? 0),
//             cramount: Number(r.cramount ?? 0),
//             runningbalance: r.runningbalance ?? null,
//           }));
//           setRows(mapped);
//         } else {
//           setRows([]);
//         }
//       } catch (e) {
//         console.error('[GLReportsModal] gl rows load failed', e);
//         setRows([]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [show, fundId, date, selectedAccount, scope]);

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> GL Report — <span className="text-muted">{date || '-'}</span>
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Form className="mb-2">
//           <Row className="mb-3">
//             <Col md={5}>
//               <Form.Label>Select Chart Of Accounts</Form.Label>
//               <div className="d-flex gap-2">
//                 <Form.Select
//                   disabled={accLoading || accounts.length === 0}
//                   value={selectedAccount}
//                   onChange={(e) => setSelectedAccount(e.target.value)}
//                 >
//                   {accounts.length === 0 ? (
//                     <option value="">No accounts</option>
//                   ) : (
//                     accounts.map((a) => (
//                       <option key={a.gl_code} value={a.gl_code}>
//                         {a.label}
//                       </option>
//                     ))
//                   )}
//                 </Form.Select>

//                 {/* 🔘 Small "Show All" button */}
               
//               </div>
//               <Form.Text muted>
//                 {selectedAccount ? `Filtering by ${selectedAccount}` : 'Showing all accounts'}
//               </Form.Text>
//             </Col>

//             <Col md={5}>
//               <Form.Label>Select Category</Form.Label>
//               <Form.Select value={scope} onChange={(e) => setScope(e.target.value)}>
//                 <option value="MTD">MTD</option>
//                 <option value="QTD">QTD</option>
//                 <option value="YTD">YTD</option>
//               </Form.Select>
//             </Col>
//             <Col md={2}>
//              <Button
//                   variant="outline-secondary"
//                   size="sm"
//                   title="Show all accounts"
//                   onClick={() => setSelectedAccount('')}
//                 >
//                   Show All
//                 </Button>
//             </Col>
//           </Row>
//         </Form>

//         <div style={{ height: 420, width: '100%', minWidth: '900px' }}>
//           <AgGridReact
//             rowData={rows}
//             columnDefs={columnDefs}
//             rowModelType="clientSide"
//             pagination={true}
//             paginationPageSize={10}
//             overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined}
//           />
//         </div>
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={handleClose}>Close</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default GLReportsModal;


// 'use client'

// import { useEffect, useMemo, useState } from 'react';
// import Cookies from 'js-cookie';
// import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
// import { AgGridReact } from 'ag-grid-react';
// import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
// import { Eye } from 'lucide-react';

// ModuleRegistry.registerModules([ClientSideRowModelModule]);

// const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// function getAuthHeaders() {
//   const token = Cookies.get('dashboardToken');
//   const h = { Accept: 'application/json' };
//   if (token) h.Authorization = `Bearer ${token}`;
//   return h;
// }

// const GLReportsModal = ({ show, handleClose, fundId, date }) => {
//   const [accounts, setAccounts] = useState([]);           // [{gl_code, account_name, label}, ...]
//   const [selectedAccount, setSelectedAccount] = useState(''); // gl_code
//   const [scope, setScope] = useState('MTD');              // MTD | QTD | YTD

//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [accLoading, setAccLoading] = useState(false);

//   const columnDefs = useMemo(() => [
//     { headerName: 'Date', field: 'date', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Journal ID', field: 'journalid', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Account Name', field: 'accountname', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Description', field: 'description', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Dr Amount', field: 'dramount', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Cr Amount', field: 'cramount', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Running Balance', field: 'runningbalance', sortable: true, filter: true, flex: 1 },
//   ], []);

//   // 1) Load Chart of Accounts whenever modal opens (and fundId is known)
//   useEffect(() => {
//     if (!show || !fundId) return;

//     (async () => {
//       try {
//         setAccLoading(true);
//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/chart-of-accounts`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

//         const json = await resp.json(); // { rows }
//         const list = (json?.rows || []).map(a => ({
//           gl_code: a.gl_code,
//           account_name: a.account_name,
//           label: a.label || `${a.gl_code} — ${a.account_name}`,
//         }));

//         setAccounts(list);

//         // set default selection (keep current if still present)
//         if (list.length) {
//           const keep = list.find(x => x.gl_code === selectedAccount);
//           setSelectedAccount(keep ? keep.gl_code : list[0].gl_code);
//         } else {
//           setSelectedAccount('');
//         }
//       } catch (e) {
//         console.error('[GLReportsModal] accounts load failed', e);
//         setAccounts([]);
//         setSelectedAccount('');
//       } finally {
//         setAccLoading(false);
//       }
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [show, fundId]);

//   // 2) Load GL rows whenever modal is open and (fundId, date, selectedAccount, scope) are ready
//   useEffect(() => {
//     if (!show || !fundId || !date) return;

//     (async () => {
//       try {
//         setLoading(true);
//         const params = new URLSearchParams();
//         params.set('date', date);
//         if (selectedAccount) params.set('account', selectedAccount);
//         if (scope) params.set('scope', scope);

//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl?${params.toString()}`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });

//         if (resp.ok) {
//           const json = await resp.json(); // { rows }
//           const mapped = (json?.rows || []).map(r => ({
//             date: r.date || date,
//             journalid: r.journalid,
//             accountname: r.accountname,
//             description: r.description,
//             dramount: Number(r.dramount ?? 0),
//             cramount: Number(r.cramount ?? 0),
//           }));
//           setRows(mapped);
//         } else {
//           // No data? still show empty
//           setRows([]);
//         }
//       } catch (e) {
//         console.error('[GLReportsModal] gl rows load failed', e);
//         setRows([]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [show, fundId, date, selectedAccount, scope]);

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> GL Report — <span className="text-muted">{date || '-'}</span>
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Form className="mb-2">
//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Label>Select Chart Of Accounts</Form.Label>
//               <Form.Select
//                 disabled={accLoading || accounts.length === 0}
//                 value={selectedAccount}
//                 onChange={(e) => setSelectedAccount(e.target.value)}
//               >
//                 {accounts.length === 0 ? (
//                   <option value="">No accounts</option>
//                 ) : (
//                   accounts.map((a) => (
//                     <option key={a.gl_code} value={a.gl_code}>
//                       {a.label}
//                     </option>
//                   ))
//                 )}
//               </Form.Select>
//             </Col>

//             <Col md={6}>
//               <Form.Label>Select Category</Form.Label>
//               <Form.Select value={scope} onChange={(e) => setScope(e.target.value)}>
//                 <option value="MTD">MTD</option>
//                 <option value="QTD">QTD</option>
//                 <option value="YTD">YTD</option>
//               </Form.Select>
//             </Col>
//           </Row>
//         </Form>

//         <div style={{ height: 420, width: '100%', minWidth: '900px' }}>
//           <AgGridReact
//             rowData={rows}
//             columnDefs={columnDefs}
//             rowModelType="clientSide"
//             pagination={true}
//             paginationPageSize={10}
//             overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined}
//           />
//         </div>
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={handleClose}>Close</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default GLReportsModal;



// 'use client' 

// impor t { useEffect, useState } from 'react';
// import Cookies from 'js-cookie';
// import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
// import { AgGridReact } from 'ag-grid-react';
// import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
// import { Eye } from 'lucide-react';

// ModuleRegistry.registerModules([ClientSideRowModelModule]);

// const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// function getAuthHeaders() {
//   const token = Cookies.get('dashboardToken');
//   const h = { Accept: 'application/json' };
//   if (token) h.Authorization = `Bearer ${token}`;
//   return h;
// }

// const GLReportsModal = ({ show, handleClose, fundId, date }) => {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const columnDefs = [
//     { headerName: 'Date', field: 'date', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Journal ID', field: 'journalid', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Account Name', field: 'accountname', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Description', field: 'description', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Dr Amount', field: 'dramount', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Cr Amount', field: 'cramount', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Running Balance', field: 'runningbalance', sortable: true, filter: true, flex: 1 },
//   ];

//   // 🔄 Load GL rows for this fund + period date
//   useEffect(() => {
//     if (!show) return;
//     if (!fundId || !date) return;

//     (async () => {
//       try {
//         setLoading(true);
//         // 🔧 Adjust the endpoint to your backend (example):
//         // GET /api/v1/reports/:fundId/gl?date=YYYY-MM-DD
//         const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl?date=${encodeURIComponent(date)}`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });

//         if (resp.ok) {
//           const json = await resp.json();
//           // Expecting { rows: [...] } — map if your fields differ
//           const mapped = (json?.rows || []).map(r => ({
//             date: r.journal_date || r.date,
//             journalid: r.journal_id || r.journalid,
//             accountname: r.account_name || r.accountname,
//             description: r.description,
//             dramount: Number(r.dr_amount ?? r.dramount ?? 0),
//             cramount: Number(r.cr_amount ?? r.cramount ?? 0),
//             runningbalance: Number(r.running_balance ?? r.runningbalance ?? 0),
//           }));
//           setRows(mapped);
//         } else {
//           // fallback to your static demo data if API fails
//           setRows([
//             { date, journalid: 'DEMO-JL-1', accountname: 'Stock', description: `UPNL for ${date}`, dramount: 0, cramount: 1000, runningbalance: -1000 },
//           ]);
//         }
//       } catch (e) {
//         console.error('[GLReportsModal] load failed', e);
//         setRows([
//           { date, journalid: 'DEMO-JL-1', accountname: 'Stock', description: `UPNL for ${date}`, dramount: 0, cramount: 1000, runningbalance: -1000 },
//         ]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [show, fundId, date]);

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> GL Report — <span className="text-muted">{date || '-'}</span>
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <Form className="mb-2">
//           <Row className="mb-6">
//             <Col md={6}>
//               <Form.Label>Select Chart Of Accounts</Form.Label>
//               <Form.Control as="select" defaultValue="13110">
//                 <option value="11001">11001 - Velocity</option>
//                 <option value="11002">11002 - Clear Street</option>
//                 <option value="12001">12001 - Morgan Stanley</option>
//                 <option value="13110">13110 - Stock</option>
//                 <option value="13210">13210 - Stock</option>
//                 <option value="14000">14000 - Investment Clearing</option>
//                 <option value="21110">21110 - Stock</option>
//                 <option value="21210">21210 - Stock</option>
//                 <option value="31000">31000 - Opening Equity</option>
//                 <option value="32000">32000 - Contribution</option>
//                 <option value="33000">33000 - Distribution</option>
//                 <option value="34000">34000 - Retained Earning</option>
//               </Form.Control>
//             </Col>
//             <Col md={6}>
//               <Form.Label>Select Category</Form.Label>
//               <Form.Control as="select" defaultValue="MTD">
//                 <option>MTD</option>
//                 <option>QTD</option>
//                 <option>YTD</option>
//               </Form.Control>
//             </Col>
//           </Row>
//         </Form>

//         <div style={{ height: 400, width: '100%', minWidth: '900px' }}>
//           <AgGridReact
//             rowData={rows}
//             columnDefs={columnDefs}
//             rowModelType="clientSide"
//             pagination={true}
//             paginationPageSize={10}
//             overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined}
//           />
//         </div>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="secondary" onClick={handleClose}>Close</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default GLReportsModal;


// 'use client'

// import { useState } from 'react';
// import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
// import { AgGridReact } from 'ag-grid-react';
// import { ClientSideRowModelModule } from 'ag-grid-community';
// import { ModuleRegistry } from 'ag-grid-community';
// import { Eye } from 'lucide-react';


// // ✅ Register required AG Grid modules
// ModuleRegistry.registerModules([ClientSideRowModelModule]);

// const GLReportsModal = ({ show, handleClose }) => {
//   const columnDefs = [
//     { headerName: 'Date', field: 'date', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Journal ID', field: 'journalid', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Account Name', field: 'accountname', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Description', field: 'description', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Dr Amount', field: 'dramount', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Cr Amount', field: 'cramount', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Running Balance', field: 'runningbalance', sortable: true, filter: true, flex: 1 },
//   ];

//   const rowData = [
//     { date: '2024-01-31', journalid: 'JL17362641959066344', accountname: 'Stock', description: 'UPNL entry for symbol AAPL on 2024-01-31', dramount: 0.00, cramount: 1101444.01, runningbalance: -1101444.01 },
//     { date: '2024-01-31', journalid: 'JL17362641959095898', accountname: 'Stock', description: 'UPNL entry for symbol ADM on 2024-01-31', dramount: 0.00, cramount: 60028.40, runningbalance: -1161472.41 },
//     { date: '2024-01-31', journalid: 'JL17362641959114333', accountname: 'Stock', description: 'UPNL entry for symbol ADM on 2024-01-31', dramount: 0.00, cramount: 15070.06, runningbalance: -1176542.47 },
//     { date: '2024-01-31', journalid: 'JL17362641959143457', accountname: 'Stock', description: 'UPNL entry for symbol ADM on 2024-01-31', dramount: 0.00, cramount: 240523.00, runningbalance: -1417065.47 },
//     { date: '2024-01-31', journalid: 'JL17362641959169738', accountname: 'Stock', description: 'UPNL entry for symbol AFRM on 2024-01-31', dramount: 0.00, cramount: 4342.02, runningbalance: -1421407.49 },
//     { date: '2024-01-31', journalid: 'JL17362641959208529', accountname: 'Stock', description: 'UPNL entry for symbol AFRM on 2024-01-31', dramount: 0.00, cramount: 20146.04, runningbalance: -1441553.53 },
//     { date: '2024-01-31', journalid: 'JL17362641959226170', accountname: 'Stock', description: 'UPNL entry for symbol AFRM on 2024-01-31', dramount: 0.00, cramount: 24510.12, runningbalance: -1466063.65 },
//     { date: '2024-01-31', journalid: 'JL17362641959256253', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 92508.60, runningbalance: -1558572.25 },
//     { date: '2024-01-31', journalid: 'JL17362641959282815', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 44475.64, runningbalance: -1603047.89 },
//     { date: '2024-01-31', journalid: 'JL17362641959319073', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 121582.01, runningbalance: -1724629.90 },
//     { date: '2024-01-31', journalid: 'JL17362641959333796', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 55411.00, runningbalance: -1780040.90 },
//     { date: '2024-01-31', journalid: 'JL17362641959362137', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 56024.20, runningbalance: -1836065.10 },
//     { date: '2024-01-31', journalid: 'JL17362641959395286', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 66270.05, runningbalance: -1902335.15 },
//     { date: '2024-01-31', journalid: 'JL17362641959436140', accountname: 'Stock', description: 'UPNL entry for symbol AGI on 2024-01-31', dramount: 0.00, cramount: 8855.16, runningbalance: -1911190.31 },
//     { date: '2024-01-31', journalid: 'JL17362641959454903', accountname: 'Stock', description: 'UPNL entry for symbol AMZN on 2024-01-31', dramount: 0.00, cramount: 30840.03, runningbalance: -1942030.34 },
//     { date: '2024-01-31', journalid: 'JL17362641959804910', accountname: 'Stock', description: 'UPNL entry for symbol BA on 2024-01-31', dramount: 0.00, cramount: 793776.47, runningbalance: -2735806.81 },
//     { date: '2024-01-31', journalid: 'JL17362641959832708', accountname: 'Stock', description: 'UPNL entry for symbol BA on 2024-01-31', dramount: 0.00, cramount: 520103.56, runningbalance: -3255910.37 },
//     { date: '2024-01-31', journalid: 'JL17362641959856965', accountname: 'Stock', description: 'UPNL entry for symbol BA on 2024-01-31', dramount: 0.00, cramount: 1047282.58, runningbalance: -4303192.95 },
//     { date: '2024-01-31', journalid: 'JL17362641959896306', accountname: 'Stock', description: 'UPNL entry for symbol BA on 2024-01-31', dramount: 0.00, cramount: 285855.25, runningbalance: -4589048.20 },
//     { date: '2024-01-31', journalid: 'JL17362641960793291', accountname: 'Stock', description: 'UPNL entry for symbol BIDU on 2024-01-31', dramount: 0.00, cramount: 507202.98, runningbalance: -5096251.18 }
//   ];
  
  

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> GL Report
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//       <Form className="mb-2">
//                     <Row className="mb-6 ">
                    
//                       <Col md={6}>
//                         <Form.Label>Select Chart Of Accounts</Form.Label>
//                         <Form.Control as="select">
//                         <option value="11001">11001 - Velocity</option>
//                         <option value="11002">11002 - Clear Street</option>
//                         <option value="12001">12001 - Morgan Stanley</option>
//                         <option value="13110">13110 - Stock</option>
//                         <option value="13210">13210 - Stock</option>
//                         <option value="14000">14000 - Investment Clearing</option>
//                         <option value="21110">21110 - Stock</option>
//                         <option value="21210">21210 - Stock</option>
//                         <option value="31000">31000 - Opening Equity</option>
//                         <option value="32000">32000 - Contribution</option>
//                         <option value="33000">33000 - Distribution</option>
//                         <option value="34000">34000 - Retained Earning</option>
//                         </Form.Control>
//                       </Col>
//                       <Col md={6}>
//                         <Form.Label>Select Category</Form.Label>
//                         <Form.Control as="select">
//                           <option>MTD</option>
//                           <option>QTD</option>
//                           <option>YTD</option>
//                         </Form.Control>
//                       </Col>
                      
//                     </Row>
//                   </Form>
//         {/* ✅ Fix AG Grid Not Showing Inside Modal */}
//         <div  style={{ height: 400, width: '100%', minWidth: '900px' }}>
//           <AgGridReact
//             rowData={rowData}
//             columnDefs={columnDefs}
//             rowModelType="clientSide"
//             pagination={true}
//             paginationPageSize={5}
//             //  domLayout="autoHeight"
//           />
//         </div>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="secondary" onClick={handleClose}>Close</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default GLReportsModal;
