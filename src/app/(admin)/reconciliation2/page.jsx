// app/(admin)/reconciliation2/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Row, Col, Card, CardHeader, CardTitle, CardBody, Modal, Button, Form } from 'react-bootstrap';

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
  const [reconciledCodes, setReconciledCodes] = useState(() => new Set()); // local set of reconciled gl_code
  const [allReconciled, setAllReconciled] = useState(false); // track if all bank/brokers are reconciled
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Initiation + review state
  const [showInitiate, setShowInitiate] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null); // { gl_code, gl_name }
  const [statementBalance, setStatementBalance] = useState('');

  const [showReview, setShowReview] = useState(false);
  const [glRows, setGlRows] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [drTotal, setDrTotal] = useState(0);
  const [crTotal, setCrTotal] = useState(0);
  const closingBalance = useMemo(() => Number(openingBalance) + Number(drTotal) - Number(crTotal), [openingBalance, drTotal, crTotal]);
  const diff = useMemo(() => Number(closingBalance) - Number(statementBalance || 0), [closingBalance, statementBalance]);

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

        // Persist button state after refresh by loading reconciled codes
        try {
          const recUrl = `${apiBase}/api/v1/reconciliation/${encodeURIComponent(fund)}/status?date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}`;
          const recResp = await fetch(recUrl, { headers: getAuthHeaders(), credentials: 'include' });
          if (recResp.ok) {
            const recJson = await recResp.json();
            const codes = new Set((recJson?.rows || [])
              .filter(r => String(r.status || '').toLowerCase() === 'reconciled')
              .map(r => String(r.gl_code)));
            setReconciledCodes(codes);
          }
        } catch (_) {
          // ignore best-effort
        }

        // Check if all bank/brokers are reconciled
        try {
          const summaryUrl = `${apiBase}/api/v1/reconciliation/${encodeURIComponent(fund)}/period-summary?date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}`;
          const summaryResp = await fetch(summaryUrl, { headers: getAuthHeaders(), credentials: 'include' });
          if (summaryResp.ok) {
            const summaryJson = await summaryResp.json();
            setAllReconciled(summaryJson?.success && summaryJson?.allReconciled === true);
          }
        } catch (_) {
          // ignore best-effort
        }
      } catch (e) {
        console.error('[reconciliation2] load failed:', e);
        setErr('Failed to load Bank / Broker chart-of-accounts.');
      } finally {
        setLoading(false);
      }
    })();
  }, [fund, date, month]);

  const handleInitiateClick = (record) => {
    if (!record) return;
    const gl_code = record.gl_code || record.glcode || record.code || '';
    const gl_name = record.gl_name || record.accountName || record.brokerBank || '';
    if (!gl_code) {
      alert('Missing GL Code for selected row');
      return;
    }
    if (confirm('Are you sure you want to initiate this period?')) {
      setSelectedAccount({ gl_code, gl_name });
      setStatementBalance('');
      setShowInitiate(true);
    }
  };

  const loadGlForReview = async ({ gl_code }) => {
    const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fund)}/gl?date=${encodeURIComponent(date)}&account=${encodeURIComponent(gl_code)}`;
    const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
    if (!resp.ok) throw new Error(`GL HTTP ${resp.status}`);
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
    setGlRows(mapped);
    setOpeningBalance(Number(json?.opening_balance ?? 0));
    setDrTotal(Number(json?.totals?.dr_total ?? mapped.reduce((s, r) => s + (r.dramount || 0), 0)));
    setCrTotal(Number(json?.totals?.cr_total ?? mapped.reduce((s, r) => s + (r.cramount || 0), 0)));
  };

  const handleInitiateSave = async () => {
    try {
      setShowInitiate(false);
      await loadGlForReview({ gl_code: selectedAccount?.gl_code });
      setShowReview(true);
    } catch (e) {
      console.error('[reconciliation2] load GL for review failed:', e);
      alert('Failed to load GL transactions for review');
    }
  };

  const handleReopen = async (row) => {
    const gl_code = row?.gl_code || row?.glcode || row?.code || '';
    const gl_name = row?.gl_name || row?.accountName || row?.brokerBank || '';
    
    if (!gl_code) {
      alert('Missing GL Code for selected row');
      return;
    }
    
    if (!confirm(`Are you sure you want to reopen reconciliation for ${gl_name || gl_code}?`)) return;
    
    try {
      const url = `${apiBase}/api/v1/reconciliation/reconciliation/reopen`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          fund_id: fund,
          gl_code: gl_code,
          pricing_date: date,
          pricing_month: month
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      alert('Reopened successfully');
      
      // Remove this GL from reconciled codes
      setReconciledCodes(prev => {
        const next = new Set(prev);
        next.delete(String(gl_code));
        return next;
      });
      
      // Update row status
      setRows(prev => prev.map(r => 
        String(r.gl_code || r.glcode || r.code || '') === String(gl_code)
          ? { ...r, _reconciled: false }
          : r
      ));
      
      // Check if all are still reconciled after reopen
      if (reconciledCodes.size <= 1) {
        setAllReconciled(false);
      }
    } catch (e) {
      console.error('[reconciliation2] reopen failed:', e);
      alert('Failed to reopen reconciliation');
    }
  };

  const handleReconcile = async () => {
    if (diff !== 0) return;
    try {
      // Backend route expects POST /api/v1/reconciliation/reconciliation/reconcile (no :fundId in URL)
      const url = `${apiBase}/api/v1/reconciliation/reconciliation/reconcile`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          fund_id: fund,
          gl_code: selectedAccount?.gl_code,
          gl_name: selectedAccount?.gl_name,
          pricing_date: date,
          pricing_month: month,
          statement_balance: Number(statementBalance || 0)
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      
      setShowReview(false);
      alert('Reconciled successfully');

      // Check if all are reconciled from response
      if (json?.success && json?.data?.allReconciled) {
        setAllReconciled(true);
      }

      // Flip Initiate -> Reconciled for this GL locally
      const code = String(selectedAccount?.gl_code || '');
      setReconciledCodes(prev => {
        const next = new Set(prev);
        if (code) next.add(code);
        return next;
      });
      setRows(prev => prev.map(r => (
        String(r.gl_code || r.glcode || r.code || '') === code
          ? { ...r, _reconciled: true }
          : r
      )));
    } catch (e) {
      console.error('[reconciliation2] reconcile failed:', e);
      alert('Failed to reconcile');
    }
  };

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
        width: 200,
        cellRenderer: (params) => {
          const code = String(params.data?.gl_code || params.data?.glcode || params.data?.code || '');
          const isDone = reconciledCodes.has(code) || params.data?._reconciled;
          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn btn-sm ${isDone ? 'btn-success' : 'btn-primary'}`}
                disabled={isDone}
                onClick={() => handleInitiateClick(params.data)}
              >
                {isDone ? 'Reconciled' : 'Initiate'}
              </button>
              {allReconciled && isDone && (
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() => handleReopen(params.data)}
                  title="Reopen reconciliation for this account"
                >
                  Reopen
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [date, month, reconciledCodes, allReconciled]
  );

  return (
    <>
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

    {/* Initiate Modal */}
    <Modal show={showInitiate} onHide={() => setShowInitiate(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Initiate Reconciliation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-2"><strong>GL Code:</strong> {selectedAccount?.gl_code || '—'}</div>
        <div className="mb-3"><strong>Account Name:</strong> {selectedAccount?.gl_name || '—'}</div>
        <Form.Group className="mb-2">
          <Form.Label>Statement Balance</Form.Label>
          <Form.Control
            type="number"
            value={statementBalance}
            onChange={(e) => setStatementBalance(e.target.value)}
            placeholder="Enter statement balance"
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowInitiate(false)}>Cancel</Button>
        <Button variant="primary" onClick={handleInitiateSave} disabled={!selectedAccount}>Save & Continue</Button>
      </Modal.Footer>
    </Modal>

    {/* Review/Reconcile Modal */}
    <Modal show={showReview} onHide={() => setShowReview(false)} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Reconciliation Report Sheet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>S.no</th>
                <th>Date</th>
                <th>journal Id</th>
                <th>Account Name</th>
                <th>Description</th>
                <th className="text-end">Dr Amount</th>
                <th className="text-end">Cr Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-light">
                <td colSpan={6}><strong>Opening Balance</strong></td>
                <td className="text-end">{openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              {glRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.date}</td>
                  <td>{r.journalid}</td>
                  <td>{r.accountname}</td>
                  <td>{r.description}</td>
                  <td className="text-end">{r.dramount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-end">{r.cramount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
              <tr className="table-light">
                <td colSpan={5} className="text-end"><strong>Total</strong></td>
                <td className="text-end"><strong>{drTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td className="text-end"><strong>{crTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
              </tr>
              <tr className="table-primary">
                <td colSpan={6}><strong>Closing Balance</strong></td>
                <td className="text-end">{closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr className="table-primary">
                <td colSpan={6}><strong>Statement Balance</strong></td>
                <td className="text-end">{Number(statementBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr className={diff === 0 ? 'table-success' : 'table-danger'}>
                <td colSpan={6}><strong>Difference</strong></td>
                <td className="text-end">{diff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowReview(false)}>Close</Button>
        <Button variant="success" onClick={handleReconcile} disabled={diff !== 0}>Reconcile</Button>
      </Modal.Footer>
    </Modal>
    </>
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
