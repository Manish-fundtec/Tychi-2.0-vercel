'use client';

import { useEffect, useMemo, useState } from 'react';
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
function getFundIdFromCookie() {
  try {
    
    const cookie = document.cookie.split('; ').find(c => c.startsWith('dashboardToken='));
    if (!cookie) return null;
    const token = cookie.split('=')[1];
    const payload = JSON.parse(atob((token.split('.')[1] || '')));
    return payload?.fund_id || payload?.fundId || payload?.fund?.fund_id || null;
  } catch { return null; }
}

// If you already have reporting periods endpoint, use that.
// For demo, static dates:
const getReportingPeriods = async (fundId) => {
  const url = `${apiBase}/api/v1/pricing/${encodeURIComponent(fundId)}/reporting-periods?limit=200`;
  const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  if (!resp.ok) throw new Error(`periods HTTP ${resp.status}`);
  const json = await resp.json(); // { rows, count }
  return (json?.rows || []).map(r => {
    const end = (r?.end_date || '').slice(0,10);
    const d = end ? new Date(end) : null;
    const monthLabel = r?.period_name || (d ? d.toLocaleString(undefined, { month:'long', year:'numeric' }) : '-');
    return { end, monthLabel, raw: r };
  });
};

// Fetch GL entries for bank and broker COA accounts for a specific date
const fetchGLDataForMonth = async (fundId, date) => {
  const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/gl?date=${encodeURIComponent(date)}&scope=ALL`;
  const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  if (!resp.ok) throw new Error(`GL HTTP ${resp.status}`);
  const json = await resp.json();
  
  // Filter for bank and broker accounts (you can adjust the account name/code filter as needed)
  const rows = json?.rows || [];
  const bankBrokerRows = rows.filter(r => {
    const accountName = (r.accountname || '').toLowerCase();
    return accountName.includes('bank') || accountName.includes('broker') || accountName.includes('cash');
  });
  
  return bankBrokerRows.map(r => ({
    date: r.date || date,
    journalId: r.journalid,
    accountName: r.accountname,
    description: r.description,
    drAmount: Number(r.dramount || 0),
    crAmount: Number(r.cramount || 0),
    runningBalance: r.runningbalance != null ? Number(r.runningbalance) : null,
  }));
};

export default function ReconciliationGrid({ router }) {
  const [fundId, setFundId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => setFundId(getFundIdFromCookie()), []);

  useEffect(() => {
    if (!fundId) return;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const periods = await getReportingPeriods(fundId);
        const all = await Promise.all(
          periods.map(p => fetchGLDataForMonth(fundId, p.end).catch(() => []))
        );

        const out = [];
        let idx = 1;
        periods.forEach((p, i) => {
          (all[i] || []).forEach(gl => {
            out.push({
              srNo: idx++,
              month: p.monthLabel,
              date: gl.date || p.end,
              brokerBank: gl.accountName,
              description: gl.description,
              drAmount: gl.drAmount,
              crAmount: gl.crAmount,
              closingBalance: gl.runningBalance != null ? gl.runningBalance : (gl.drAmount - gl.crAmount),
              journalId: gl.journalId,
            });
          });
        });
        setRows(out);
      } catch (e) {
        console.error('[frontend][reconciliation] error:', e);
        setErr('Failed to load GL data for bank/broker accounts');
      } finally {
        setLoading(false);
      }
    })();
  }, [fundId]);

  const columnDefs = useMemo(() => ([
    { headerName: 'S.No', width: 90, valueGetter: p => (p?.node?.rowIndex ?? 0) + 1, sortable:false, filter:false },
    { headerName: 'Reporting Period', field: 'month', flex: 1, sortable: true, filter: true },
    { headerName: 'Date', field: 'date', flex: 1, sortable: true, filter: true },
    { headerName: 'Account Name', field: 'brokerBank', flex: 1.2, sortable: true, filter: true },
    { headerName: 'Description', field: 'description', flex: 1.5, sortable: true, filter: true },
    {
      headerName: 'Dr Amount',
      field: 'drAmount',
      width: 130,
      sortable: true,
      filter: true,
      valueFormatter: p => Number(p.value || 0).toLocaleString('en-IN', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 2
      }),
    },
    {
      headerName: 'Cr Amount',
      field: 'crAmount',
      width: 130,
      sortable: true,
      filter: true,
      valueFormatter: p => Number(p.value || 0).toLocaleString('en-IN', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 2
      }),
    },
    {
      headerName: 'Balance',
      field: 'closingBalance',
      width: 130,
      sortable: true,
      filter: true,
      valueFormatter: p => p.value != null ? Number(p.value || 0).toLocaleString('en-IN', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 2
      }) : '—',
      cellClass: p => (p.value != null && Number(p.value || 0) < 0 ? 'text-danger' : '')
    },
    {
      headerName: 'Action',
      field: 'action',
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: () => null, // Remove action button for now
    },
  ]), []);

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center border-bottom">
            <CardTitle as="h4">Reconciliation</CardTitle>
          </CardHeader>
          <CardBody className="p-2">
            {err && <div className="text-danger mb-2">{err}</div>}
            <div className="ag-theme-quartz" style={{ height: 550, width: '100%' }}>
              <AgGridReact
                rowData={rows}
                columnDefs={columnDefs}
                defaultColDef={{ resizable: true }}
                pagination
                paginationPageSize={10}
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
