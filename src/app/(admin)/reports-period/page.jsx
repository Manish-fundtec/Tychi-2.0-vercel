'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap';
import { ArrowRightCircle } from 'lucide-react';

// AG Grid (CSR only)
const AgGridReact = dynamic(() => import('ag-grid-react').then(m => m.AgGridReact), { ssr: false });

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

// --- Cell renderer: arrow action ---
function ArrowRenderer(props) {
  const { data, context } = props;
  const isCompleted = String(data?.status || '').toLowerCase() === 'completed';

  if (!isCompleted) return <>—</>;

  return (
    <ArrowRightCircle
      size={18}
      className="text-primary cursor-pointer"
      title="Open Valuation"
      onClick={() => context?.handleOpenValuation?.(data)}
    />
  );
}

export default function ReportsPeriodPage() {
  const router = useRouter();

  const [fundId, setFundId] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // register AG Grid modules once
  useEffect(() => {
    import('ag-grid-community')
      .then(({ ModuleRegistry, AllCommunityModule }) => {
        ModuleRegistry.registerModules([AllCommunityModule]);
      })
      .catch(() => {});
  }, []);

  // pick fund from cookie
  useEffect(() => {
    setFundId(getFundIdFromCookie());
  }, []);

  // fetch reporting periods
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
          const end = (r?.end_date || '').slice(0, 10);
          const monthLabel =
            r?.period_name ||
            (() => {
              const d = end ? new Date(end) : null;
              return d && !isNaN(d) ? d.toLocaleString(undefined, { month: 'long', year: 'numeric' }) : '-';
            })();
          return {
            srNo: i + 1,
            month: monthLabel,      // Month label
            date: end,              // YYYY-MM-DD (pricing date)
            status: String(r?.status || 'completed').toLowerCase(),
            raw: r,
          };
        });

        setRowData(rows);
      } catch (e) {
        console.error('[ReportsPeriod] load failed:', e);
        setErr('Failed to load reporting periods.');
      } finally {
        setLoading(false);
      }
    })();
  }, [fundId]);

//   // navigate to valuation page for that date
//   function handleOpenValuation(row) {
//     // adjust this route to match your app structure
//     const qs = new URLSearchParams({ fund: fundId || '', date: row?.date || '' }).toString();
//     router.push(`/reports?${qs}`);
//   }

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Sr.No',
        flex: 1,
        valueGetter: (p) => p.node.rowIndex + 1,
        sortable: false,
        filter: false,
        },
      { headerName: 'Month', field: 'month', flex: 1, sortable: true, filter: true },
      { headerName: 'Date', field: 'date', flex: 1, sortable: true, filter: true },
      {
        headerName: 'Action',
        field: 'action',
        width: 180,
        sortable: false,
        filter: false,
        cellRenderer: 'ArrowRenderer',
      },
    ],
    []
  );
  function ArrowRenderer(props) {
  const { data, context } = props;
  const isCompleted = String(data?.status || '').toLowerCase() === 'completed';
  if (!isCompleted) return <>—</>;

  return (
    <ArrowRightCircle
      size={18}
      className="text-primary cursor-pointer"
      title="Open Reports"
      onClick={() =>
        context?.router?.push(
          `/reports?fund=${encodeURIComponent(context.fundId || '')}` +
          `&date=${encodeURIComponent(data?.date || '')}` +
          `&month=${encodeURIComponent(data?.month || '')}`
        )
      }
    />
  );
}

  return (
    <Row>
      <Col xl={12}>
        <Card className="shadow-sm">
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <CardTitle as="h4">Reports — Periods</CardTitle>
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
                defaultColDef={{ resizable: true }}
                overlayLoadingTemplate={
                  loading ? '<span class="ag-overlay-loading-center">Loading…</span>' : undefined
                }
                context={{ router, fundId }}
                components={{ ArrowRenderer }}
              />
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}

// 'use client'; // ✅ Ensures this is a Client Component

// import dynamic from 'next/dynamic';
// import { useEffect, useState } from 'react';
// import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, Modal, Row, Button } from 'react-bootstrap';
// import { Eye } from 'lucide-react';

// // ✅ Dynamically import ToggleBetweenModals to avoid SSR issues
// // const ToggleBetweenModals = dynamic(() => 
// //   import('@/app/(admin)/base-ui/modals/components/AllModals').then(mod => mod.ToggleBetweenModals), 
// //   { ssr: false }
// // );

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
//         { srNo: 1, month: 'January', date: '2025-01-31', Action : 'Completed' },
//         { srNo: 2, month: 'February', date: '2025-02-28', Action : 'Completed' },
//         { srNo: 3, month: 'March', date: '2025-03-31', Action : 'Completed' },
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
//               <CardTitle as="h4">Rports</CardTitle>
//               {/* <Dropdown>
//                 <ToggleBetweenModals />
//               </Dropdown> */}
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

//      {/* Symbol List Modal
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
//       </Modal> */}
//     </>
//   );
// };

// export default ReviewsPage;
