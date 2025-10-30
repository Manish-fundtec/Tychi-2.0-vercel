// app/(admin)/reconciliation2/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
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

export default function Reconciliation2Page() {
  const searchParams = useSearchParams();

  const fund = searchParams.get('fund') || '';
  const date = searchParams.get('date') || '';
  const month = searchParams.get('month') || '';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!fund) return;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const url =
          `${apiBase}/api/v1/reconciliation/${encodeURIComponent(fund)}/bank-gl` +
          `?date=${encodeURIComponent(date || '')}&month=${encodeURIComponent(month || '')}`;

        const resp = await fetch(url, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        setRows(json?.rows || []);
      } catch (e) {
        console.error('[reconciliation2] load failed:', e);
        setErr('Failed to load Bank / Broker chart-of-accounts.');
      } finally {
        setLoading(false);
      }
    })();
  }, [fund, date, month]);

  const colDefs = useMemo(
    () => [
      {
        headerName: 'S.No',
        width: 80,
        valueGetter: p => p.node.rowIndex + 1,
      },
      {
        headerName: 'Reporting Period',
        field: 'reporting_period',
        flex: 1,
        valueGetter: p => p.data?.reporting_period || month || '',
      },
      {
        headerName: 'Reporting Date',
        field: 'reporting_date',
        flex: 1,
        valueGetter: p => p.data?.reporting_date || date || '',
      },
      {
        headerName: 'Broker & Bank Name',
        field: 'gl_name', // from backend
        flex: 2,
      },
      {
        headerName: 'Closing Balance',
        field: 'closing_balance',
        flex: 1,
        valueFormatter: p => {
          const v = Number(p.value || 0);
          return v.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
      },
      {
        headerName: 'Action',
        field: 'action',
        width: 120,
        cellRenderer: params => {
          return (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                // yaha baad me modal open / reconcile call
                alert(`Initiate reconciliation for ${params.data?.gl_name}`);
              }}
            >
              Initiate
            </button>
          );
        },
      },
    ],
    [date, month]
  );

  return (
    <Row>
      <Col xl={12}>
        <Card className="shadow-sm">
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Reconciliation — Bank / Broker (COA)</CardTitle>
            <small className="text-muted">
              Fund: {fund ? fund.slice(0, 8) + '…' : '—'} &nbsp;|&nbsp;{' '}
              {month || '—'} &nbsp;|&nbsp; {date || '—'}
            </small>
          </CardHeader>
          <CardBody className="p-2">
            {err && <div className="text-danger mb-2">{err}</div>}
            <div className="ag-theme-quartz" style={{ height: 520 }}>
              <AgGridReact
                rowData={rows}
                columnDefs={colDefs}
                defaultColDef={{ resizable: true, sortable: true, filter: true }}
                pagination
                paginationPageSize={15}
                overlayLoadingTemplate={
                  loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
                }
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
//     { srNo: 1, month: 'January', date: '2025-01-01', brokerBank: 'ABC Bank', closingBalance: '$5000' },
//     { srNo: 2, month: 'February', date: '2025-02-14', brokerBank: 'XYZ Broker', closingBalance: '$7500' },
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
//                   columnDefs={colmdefs.reconciliation2columnDefs} // Column definitions
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
