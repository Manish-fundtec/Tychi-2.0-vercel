// app/(admin)/reconciliation/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Row, Col, Card, CardHeader, CardTitle, CardBody } from 'react-bootstrap';

ModuleRegistry.registerModules([AllCommunityModule]);

const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken');
  const h = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function getFundIdFromCookie() {
  try {
    const cookie = document.cookie.split('; ').find(c => c.startsWith('dashboardToken='));
    if (!cookie) return null;
    const token = cookie.split('=')[1];
    const payload = JSON.parse(atob((token.split('.')[1] || '')));
    return payload?.fund_id || payload?.fundId || payload?.fund?.fund_id || null;
  } catch {
    return null;
  }
}

// Status renderer: shows "Open" or "Reconciled"
function StatusRenderer(props) {
  const status = props?.data?.status || 'open';
  if (status === 'reconciled') {
    return <span className="badge bg-success">Reconciled</span>;
  }
  return <span className="badge bg-warning text-dark">Open</span>;
}

// Action renderer: "Open" button that becomes "Reconciled" when done
function ActionRenderer(props) {
  const { data, context } = props;
  if (!data || !context?.router) return <span className="text-muted">—</span>;

  const { router, fundId } = context;
  const isDone = (data.status || '').toLowerCase() === 'reconciled';

  return (
    <button
      className={`btn btn-sm ${isDone ? 'btn-success' : 'btn-primary'}`}
      onClick={() => {
        router.push(
          `/reconciliation2?fund=${encodeURIComponent(fundId || '')}` +
            `&date=${encodeURIComponent(data?.date || '')}` +
            `&month=${encodeURIComponent(data?.month || '')}`
        );
      }}
    >
      {isDone ? 'Reconciled' : 'Open'}
    </button>
  );
}

export default function ReconciliationPage() {
  const router = useRouter();
  const [fundId, setFundId] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    setFundId(getFundIdFromCookie());
  }, []);

  useEffect(() => {
    if (!fundId) return;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(
          fundId
        )}/reporting-periods?limit=200`;
        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        const baseRows = (json?.rows || []).map((r, i) => {
          const end = (r?.end_date || '').slice(0, 10);
          const d = end ? new Date(end) : null;
          const hasValidDate = d && !Number.isNaN(d.getTime());
          const monthLabel =
            r?.period_name ||
            (hasValidDate ? d.toLocaleString(undefined, { month: 'long', year: 'numeric' }) : '-');

          return {
            srNo: i + 1,
            month: monthLabel,
            date: end,
            status: 'open',
            raw: r,
          };
        });

        // Check reconciliation status for each period
        const enriched = await Promise.all(
          baseRows.map(async row => {
            if (!row.date) return row;
            try {
              const sUrl = `${apiBase}/api/v1/reconciliation/${encodeURIComponent(
                fundId
              )}/period-summary?date=${encodeURIComponent(row.date)}&month=${encodeURIComponent(
                row.month
              )}`;
              const sResp = await fetch(sUrl, {
                headers: getAuthHeaders(),
                credentials: 'include',
              });
              if (!sResp.ok) return row;
              const sJson = await sResp.json();
              if (sJson?.success && sJson.allReconciled) {
                return { ...row, status: 'reconciled' };
              }
              return row;
            } catch {
              return row;
            }
          })
        );

        setRowData(enriched);
      } catch (e) {
        console.error(e);
        setErr('Failed to load reporting periods.');
      } finally {
        setLoading(false);
      }
    })();
  }, [fundId]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Sr.No',
        width: 100,
        valueGetter: p => p.node.rowIndex + 1,
      },
      { headerName: 'Month', field: 'month', flex: 1, sortable: true, filter: true },
      { headerName: 'Date', field: 'date', flex: 1, sortable: true, filter: true },
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        cellRenderer: 'StatusRenderer',
      },
      {
        headerName: 'Action',
        field: 'action',
        width: 120,
        cellRenderer: 'ActionRenderer',
      },
    ],
    []
  );

  return (
    <Row>
      <Col xl={12}>
        <Card className="shadow-sm">
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Reconciliation — Reporting Periods</CardTitle>
          </CardHeader>
          <CardBody className="p-2">
            {err && <div className="text-danger mb-2">{err}</div>}
            <div className="ag-theme-quartz" style={{ height: 550 }}>
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={{ resizable: true }}
                pagination
                paginationPageSize={10}
                overlayLoadingTemplate={
                  loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
                }
                context={{ router, fundId }}
                components={{ StatusRenderer, ActionRenderer }}
              />
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}


// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import Cookies from 'js-cookie';
// import { useRouter } from 'next/navigation';
// import { AgGridReact } from 'ag-grid-react';
// import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
// import { Row, Col, Card, CardHeader, CardTitle, CardBody } from 'react-bootstrap';
// // Removed ArrowRightCircle import as we're using button instead

// // AG Grid modules (register once)
// ModuleRegistry.registerModules([AllCommunityModule]);

// const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// // --- auth header helper
// function getAuthHeaders() {
//   const token = Cookies.get('dashboardToken');
//   const h = { Accept: 'application/json' };
//   if (token) h.Authorization = `Bearer ${token}`;
//   return h;
// }

// // --- fund id from cookie
// function getFundIdFromCookie() {
//   try {
//     const cookie = document.cookie.split('; ').find(c => c.startsWith('dashboardToken='));
//     if (!cookie) return null;
//     const token = cookie.split('=')[1];
//     const payload = JSON.parse(atob((token.split('.')[1] || '')));
//     return payload?.fund_id || payload?.fundId || payload?.fund?.fund_id || null;
//   } catch {
//     return null;
//   }
// }

// // --- Status cell renderer: shows status with badge
// function StatusRenderer(props) {
//   // Always show "Open" status with warning badge
//   return <span className="badge bg-warning">Open</span>;
// }

// // --- Action cell: initiate reconciliation for selected period
// function ActionRenderer(props) {
//   const { data, context } = props;

//   // If something is missing, show a placeholder
//   if (!data || !context || !context.router) {
//     return <span className="text-muted">—</span>;
//   }

//   const handleClick = () => {
//     const fund  = encodeURIComponent(context.fundId || '');
//     const date  = encodeURIComponent(data?.date || '');
//     const month = encodeURIComponent(data?.month || '');
//     context.router.push(`/reconciliation?fund=${fund}&date=${date}&month=${month}`);
//   };

//   return (
//     <button
//       className="btn btn-sm btn-primary"
//       title="Initiate Reconciliation"
//       onClick={() =>
//           context?.router?.push(
//             `/reconciliation2?fund=${encodeURIComponent(context.fundId || '')}` +
//             `&date=${encodeURIComponent(data?.date || '')}` +
//             `&month=${encodeURIComponent(data?.month || '')}`
//           )
//         }
//     >
//       Initiate
//     </button>
//   );
// }

// export default function ReconciliationPage() {
//   const router = useRouter();
//   const [fundId, setFundId] = useState(null);
//   const [rowData, setRowData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState('');

//   useEffect(() => {
//     setFundId(getFundIdFromCookie());
//   }, []);

//   // Fetch reporting periods
//   useEffect(() => {
//     if (!fundId) return;
//     (async () => {
//       setLoading(true);
//       setErr('');
//       try {
//         const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods?limit=200`;
//         const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//         const json = await resp.json(); // { rows, count }

//         const rows = (json?.rows || []).map((r, i) => {
//           const end = (r?.end_date || '').slice(0, 10); // YYYY-MM-DD
//           const d = end ? new Date(end) : null;
//           const hasValidDate = d && !Number.isNaN(d.getTime());
//           const monthLabel =
//             r?.period_name ||
//             (hasValidDate ? d.toLocaleString(undefined, { month: 'long', year: 'numeric' }) : '-');

//           const status = String(r?.status || 'open').toLowerCase();

//           return {
//             srNo: i + 1,
//             month: monthLabel,
//             date: end,
//             status,
//             raw: r,
//           };
//         });

//         setRowData(rows);
//       } catch (e) {
//         console.error('[Reconciliation] load periods failed:', e);
//         setErr('Failed to load reporting periods.');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [fundId]);

//   const columnDefs = useMemo(
//     () => [
//       {
//         headerName: 'Sr.No',
//         width: 100,
//         valueGetter: p => p.node.rowIndex + 1,
//         sortable: false,
//         filter: false,
//       },
//       { headerName: 'Month', field: 'month', flex: 1, sortable: true, filter: true },
//       { headerName: 'Date', field: 'date', flex: 1, sortable: true, filter: true },
//         {
//           headerName: 'Status',
//           field: 'status',
//           width: 120,
//           sortable: true,
//           filter: true,
//           cellRenderer: 'StatusRenderer',
//         },
//       {
//         headerName: 'Action',
//         field: 'action',
//         width: 120,
//         sortable: false,
//         filter: false,
//         cellRenderer: 'ActionRenderer',
//       },
//     ],
//     []
//   );

//   return (
//     <Row>
//       <Col xl={12}>
//         <Card className="shadow-sm">
//           <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
//             <CardTitle as="h4">Reconciliation — Reporting Periods</CardTitle>
//           </CardHeader>

//           <CardBody className="p-2">
//             {err && <div className="text-danger mb-2">{err}</div>}
//             <div className="ag-theme-quartz" style={{ height: 550, width: '100%' }}>
//               <AgGridReact
//                 rowData={rowData}
//                 columnDefs={columnDefs}
//                 defaultColDef={{ resizable: true }}
//                 pagination
//                 paginationPageSize={10}
//                 overlayLoadingTemplate={
//                   loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
//                 }
//                 context={{ router, fundId }}
//                 components={{ StatusRenderer, ActionRenderer }}
//               />
//             </div>
//           </CardBody>
//         </Card>
//       </Col>
//     </Row>
//   );
// }



// 'use client'
// import PageTitle from '@/components/PageTitle'
// import IconifyIcon from '@/components/wrappers/IconifyIcon'
// import { getAllReview } from '@/helpers/data'
// import Image from 'next/image'
// import Link from 'next/link'
// import { AgGridReact } from 'ag-grid-react'
// import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
// import { useState } from 'react'
// import colmdefs from '@/assets/tychiData/columnDefs'; 
// ModuleRegistry.registerModules([AllCommunityModule])
// import {
//   Button,
//   Card,
//   CardBody,
//   CardFooter,
//   CardHeader,
//   CardTitle,
//   Col,
//   Dropdown,
//   DropdownItem,
//   DropdownMenu,
//   DropdownToggle,
//   Row,
//   Modal,
// } from 'react-bootstrap'

// const ReviewsPage = () => {
//   // Dummy data for rows
//   const reortRowData = [
//     { srNo: 1, month: 'January', date: '2025-01-01', status: 'Pending' },
//     { srNo: 2, month: 'February', date: '2025-02-14', status: 'Completed' },
//   ];
  
//   const [rowData] = useState(reortRowData) // Set dummy data as initial state


//   return (
//     <>
//       <Row>
//         <Col xl={12}>
//           <Card>
//             <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
//               <CardTitle as={'h4'}>Reconciliation</CardTitle>
//               <Dropdown>
//                 {/* Dropdown can be added here if needed */}
//               </Dropdown>
//             </CardHeader>
//             <CardBody className="p-2">
//               <div
//                 style={{
//                   height: 550,
//                   width: '100%',
//                 }}>
//                 <AgGridReact
//                   rowData={rowData} // Data for rows
//                   columnDefs={colmdefs.reconciliationColDefs} // Column definitions
//                   pagination={true} // Enable pagination
//                   paginationPageSize={10} // Set page size
//                   defaultColDef={colmdefs.defaultColDef}
//                 />
//               </div>
//             </CardBody>
//           </Card>
//         </Col>
//       </Row>
//     </>
//   )
// }
// export default ReviewsPage;
