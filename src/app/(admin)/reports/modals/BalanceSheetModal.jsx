'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { Button, Modal, Table, Spinner } from 'react-bootstrap';
import { Eye } from 'lucide-react';
import { buildAoaFromHeaders, exportAoaToXlsx } from '@/lib/exporters/xlsx';
import { useDashboardToken } from '@/hooks/useDashboardToken';
import { getFundDetails } from '@/lib/api/fund';
import currencies from 'currency-formatter/currencies';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken');
  const h = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

const EXCLUDED_PARENT_GL_CODES = new Set(['11000', '12000', '21200']);

/**
 * Balance Sheet – pulls only from chartofaccounts + journals (as-of date)
 * Sections: Assets, Liabilities, Equity
 * Totals + Balance check: Assets - (Liabilities + Equity)
 */
export default function BalanceSheetModal({
  show,
  handleClose,
  fundId,
  date,                   // 'YYYY-MM-DD'
  retainedGl = '34000',   // retained earnings GL (can override)
}) {
  const dashboard = useDashboardToken();
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

  // Get currency symbol from reporting_currency
  const currencySymbol = useMemo(() => {
    const reportingCurrency = dashboard?.reporting_currency || dashboard?.fund?.reporting_currency || '';
    if (!reportingCurrency) return '';
    const currency = currencies.find((c) => c.code === reportingCurrency);
    return currency?.symbol || '';
  }, [dashboard]);
  const exportHeaders = useMemo(
    () => [
      { key: 'category', label: 'Category' },
      { key: 'gl_code', label: 'GL Number' },
      { key: 'gl_name', label: 'GL Name' },
      { key: 'amount', label: 'Amount' },
    ],
    [],
  );
  const formatExportValue = (key, value) => (key === 'amount' ? fmt(value) : value ?? '');

  // Fetch balance sheet rows
  useEffect(() => {
    if (!show || !fundId || !date) return;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        const params = new URLSearchParams();
        params.set('date', date);
        if (retainedGl) params.set('retained_gl', retainedGl);

        const url = `${apiBase}/api/v1/reports/${encodeURIComponent(
          fundId
        )}/balance-sheet-journals?${params.toString()}`;

        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        // backend shape per our repo: { success, data: { assets, liabilities, equity, totals } }
        const merged = json?.data
          ? [...(json.data.assets || []), ...(json.data.liabilities || []), ...(json.data.equity || [])]
          : Array.isArray(json?.rows)
          ? json.rows
          : [];

        const filtered = Array.isArray(merged)
          ? merged.filter((row) => {
              const glCode = String(row?.gl_code || row?.glNumber || row?.glnumber || '').trim();
              return glCode && !EXCLUDED_PARENT_GL_CODES.has(glCode);
            })
          : [];

        setRows(filtered);
      } catch (e) {
        console.error('[BS] fetch failed', e);
        setErr('Failed to load Balance Sheet.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, fundId, date, retainedGl]);

  const handleExportCsv = () => {
    if (!rows?.length) {
      alert('No balance sheet rows to export.');
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
    const dataRows = rows.map((row) =>
      exportHeaders
        .map(({ key }) => escapeCsv(formatExportValue(key, row[key])))
        .join(','),
    );

    // Add totals rows
    const totalsRows = [
      ['Assets Total', '', '', escapeCsv(formatExportValue('amount', totA))].join(','),
      ['Liabilities Total', '', '', escapeCsv(formatExportValue('amount', totL))].join(','),
      ['Equity Total', '', '', escapeCsv(formatExportValue('amount', totE))].join(','),
      ['Total Liabilities & Equity', '', '', escapeCsv(formatExportValue('amount', totalLiabilitiesAndEquity))].join(','),
    ];

    const csvContent = ['\ufeff' + headerRow, ...dataRows, ...totalsRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `balance-sheet-${fundId || 'fund'}-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const handleExportXlsx = () => {
    if (!rows?.length) {
      alert('No balance sheet rows to export.');
      return;
    }
    const aoa = buildAoaFromHeaders(exportHeaders, rows, formatExportValue);
    
    // Add totals rows
    aoa.push(['Assets Total', '', '', formatExportValue('amount', totA)]);
    aoa.push(['Liabilities Total', '', '', formatExportValue('amount', totL)]);
    aoa.push(['Equity Total', '', '', formatExportValue('amount', totE)]);
    aoa.push(['Total Liabilities & Equity', '', '', formatExportValue('amount', totalLiabilitiesAndEquity)]);
    
    exportAoaToXlsx({
      fileName: `balance-sheet-${fundId || 'fund'}-${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Balance Sheet',
      aoa,
    });
  };

  // group, sort, totals, check
const {
  assets, liabilities, equity,
  totA, totL, totE, totalLiabilitiesAndEquity,
} = useMemo(() => {
    const byCat = (cat) =>
      rows
        .filter(r => String(r.category || '').toLowerCase() === cat)
        .sort((a, b) => {
          const A = String(a.gl_code || a.glNumber || a.glnumber || '');
          const B = String(b.gl_code || b.glNumber || b.glnumber || '');
          const ai = /^\d+$/.test(A) ? parseInt(A, 10) : Number.POSITIVE_INFINITY;
          const bi = /^\d+$/.test(B) ? parseInt(B, 10) : Number.POSITIVE_INFINITY;
          return ai - bi || A.localeCompare(B);
        });

    const assets = byCat('asset');
    const liabilities = byCat('liability');
    const equity = byCat('equity');

    const sum = (arr, k) => arr.reduce((s, x) => s + Number(x?.[k] ?? x?.amount ?? 0), 0);
    const totA = sum(assets, 'amount');
    const totL = sum(liabilities, 'amount');
    const totE = sum(equity, 'amount');

  const totalLiabilitiesAndEquity = totL + totE;

  return { assets, liabilities, equity, totA, totL, totE, totalLiabilitiesAndEquity };
  }, [rows]);

  const renderSection = (title, data) => (
    <>
      <tr className="table-light">
        <th colSpan={2}>{title}</th>
        <th className="text-end">Amount</th>
      </tr>
      {data.map((r, idx) => (
        <tr key={`${title}-${idx}`}>
          <td style={{ width: 120 }}>{r.gl_code || r.glNumber || r.glnumber}</td>
          <td>{r.gl_name || r.glName}</td>
          <td className="text-end">{currencySymbol}{fmt(r.amount)}</td>
        </tr>
      ))}
    </>
  );

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={18} />
          BALANCE SHEET <span className="text-muted ms-2">{date || ''}</span>
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
                  <th style={{ width: 120 }}>GL Number</th>
                  <th>GL Name</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* ASSETS */}
                {renderSection('ASSETS', assets)}
                <tr className="fw-semibold">
                  <td colSpan={2}>Total Assets</td>
                  <td className="text-end">{currencySymbol}{fmt(totA)}</td>
                </tr>

                {/* LIABILITIES */}
                {renderSection('LIABILITIES', liabilities)}
                <tr className="fw-semibold">
                  <td colSpan={2}>Total Liabilities</td>
                  <td className="text-end">{currencySymbol}{fmt(totL)}</td>
                </tr>

                {/* EQUITY */}
                {renderSection('EQUITY', equity)}
                <tr className="fw-semibold">
                  <td colSpan={2}>Total Equity</td>
                  <td className="text-end">{currencySymbol}{fmt(totE)}</td>
                </tr>

                <tr className="table-light fw-bold">
                  <td colSpan={2}>Total Liabilities &amp; Equities</td>
                  <td className="text-end">{currencySymbol}{fmt(totalLiabilitiesAndEquity)}</td>
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

// 'use client'

// import { useState } from 'react';
// import { Button, Modal } from 'react-bootstrap';
// import { AgGridReact } from 'ag-grid-react';
// import { ClientSideRowModelModule } from 'ag-grid-community';
// import { ModuleRegistry } from 'ag-grid-community';
// import { Eye } from 'lucide-react';

// // ✅ Register required AG Grid modules
// ModuleRegistry.registerModules([ClientSideRowModelModule]);

// const BalanceSheetModal = ({ show, handleClose }) => {
//   const columnDefs = [
//     { headerName: 'GL Number', field: 'glNumber', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Type', field: 'type', sortable: true, filter: true, flex: 1 },
//     { headerName: 'GL Name', field: 'glName', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Amount', field: 'amount', sortable: true, filter: true, flex: 1 },
//   ];

//   const rowData = [
//     { glNumber: '1001', type: 'Asset', glName: 'Cash', amount: 50000 },
//     { glNumber: '2001', type: 'Liability', glName: 'Accounts Payable', amount: 20000 },
//     { glNumber: '3001', type: 'Equity', glName: 'Retained Earnings', amount: 15000 },
//   ];

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> Balance Sheet
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {/* ✅ Fix AG Grid Not Showing Inside Modal */}
//         <div  style={{ height: 400, width: '100%', minWidth: '900px' }}>
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

// export default BalanceSheetModal;
