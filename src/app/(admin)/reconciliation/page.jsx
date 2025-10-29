'use client';

import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Row, Col, Card, CardHeader, CardTitle, CardBody } from 'react-bootstrap';
// Removed ArrowRightCircle import as we're using button instead

// AG Grid modules (register once)
ModuleRegistry.registerModules([AllCommunityModule]);

const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

// --- auth header helper
function getAuthHeaders() {
  const token = Cookies.get('dashboardToken');
  const h = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// --- fund id from cookie
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

// --- Action cell: initiate reconciliation for selected period
function ActionRenderer(props) {
  const { data, context } = props;
  const status = String(data?.status || '').toLowerCase();
  
  // Show "Initiate" button for both 'open' and 'completed' status
  if (status === 'completed' || status === 'open') {
    return (
      <button
        className="btn btn-sm btn-primary"
        title="Initiate Reconciliation"
        onClick={() =>
          context?.router?.push(
            `/reconciliation?fund=${encodeURIComponent(context.fundId || '')}` +
            `&date=${encodeURIComponent(data?.date || '')}` +
            `&month=${encodeURIComponent(data?.month || '')}`
          )
        }
      >
        Initiate
      </button>
    );
  }
  
  return <span className="text-muted">—</span>;
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

  // Fetch reporting periods
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

        const rows = (json?.rows || []).map((r, i) => {
          const end = (r?.end_date || '').slice(0, 10); // YYYY-MM-DD
          const d = end ? new Date(end) : null;
          const hasValidDate = d && !Number.isNaN(d.getTime());
          const monthLabel =
            r?.period_name ||
            (hasValidDate ? d.toLocaleString(undefined, { month: 'long', year: 'numeric' }) : '-');

          const status = String(r?.status || 'open').toLowerCase();

          return {
            srNo: i + 1,
            month: monthLabel,
            date: end,
            status,
            raw: r,
          };
        });

        setRowData(rows);
      } catch (e) {
        console.error('[Reconciliation] load periods failed:', e);
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
        sortable: false,
        filter: false,
      },
      { headerName: 'Month', field: 'month', flex: 1, sortable: true, filter: true },
      { headerName: 'Date', field: 'date', flex: 1, sortable: true, filter: true },
      { 
        headerName: 'Status', 
        field: 'status', 
        width: 120, 
        sortable: true, 
        filter: true,
        cellRenderer: (params) => {
          const status = String(params.value || 'open').toLowerCase();
          // Capitalize first letter for display
          const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
          const statusClass = status === 'completed' ? 'badge bg-success' : 'badge bg-warning';
          return `<span class="${statusClass}">${displayStatus}</span>`;
        }
      },
      {
        headerName: 'Action',
        field: 'action',
        width: 120,
        sortable: false,
        filter: false,
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
            <div className="ag-theme-quartz" style={{ height: 550, width: '100%' }}>
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
                components={{ ActionRenderer }}
              />
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}



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
