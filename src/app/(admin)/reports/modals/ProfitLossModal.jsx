'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { Button, Modal, Table, Spinner } from 'react-bootstrap';
import { Eye } from 'lucide-react';
import { buildAoaFromHeaders, exportAoaToXlsx } from '@/lib/exporters/xlsx';
import { useDashboardToken } from '@/hooks/useDashboardToken';
import { getFundDetails } from '@/lib/api/fund';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken');
  const h = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function ProfitLossModal({
  show,
  handleClose,
  fundId,
  date,                 // 'YYYY-MM-DD'
  legacyStrict = false, // set true if you want to hide all parents (strict mode)
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [fundDetails, setFundDetails] = useState(null);
  
  // Get reporting frequency from dashboard token
  const dashboard = useDashboardToken();
  const reportingFrequency = String(dashboard?.fund?.reporting_frequency || dashboard?.reporting_frequency || 'monthly').toLowerCase();
  
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
  
  // Dynamic columns based on reporting frequency
  const exportHeaders = useMemo(() => {
    const base = [
      { key: 'category', label: 'Category' },
      { key: 'gl_code', label: 'GL Number' },
      { key: 'gl_name', label: 'GL Name' },
    ];
    
    // Add columns based on frequency
    if (reportingFrequency === 'daily') {
      base.push(
        { key: 'ptd_amount', label: 'PTD' },
        { key: 'mtd_amount', label: 'MTD' },
        { key: 'qtd_amount', label: 'QTD' },
        { key: 'ytd_amount', label: 'YTD' }
      );
    } else if (reportingFrequency === 'monthly') {
      base.push(
        { key: 'mtd_amount', label: 'MTD' },
        { key: 'qtd_amount', label: 'QTD' },
        { key: 'ytd_amount', label: 'YTD' }
      );
    } else if (reportingFrequency === 'quarterly' || reportingFrequency === 'quarter') {
      base.push(
        { key: 'qtd_amount', label: 'QTD' },
        { key: 'ytd_amount', label: 'YTD' }
      );
    } else if (reportingFrequency === 'annual' || reportingFrequency === 'annually') {
      base.push(
        { key: 'ytd_amount', label: 'YTD' }
      );
    } else {
      // Default: monthly
      base.push(
        { key: 'mtd_amount', label: 'MTD' },
        { key: 'qtd_amount', label: 'QTD' },
        { key: 'ytd_amount', label: 'YTD' }
      );
    }
    
    return base;
  }, [reportingFrequency]);
  const formatExportValue = (key, value) =>
    ['ptd_amount', 'mtd_amount', 'qtd_amount', 'ytd_amount'].includes(String(key))
      ? fmt(value)
      : value ?? '';

  // fetch P&L rows
  // useEffect(() => {
  //   if (!show || !fundId || !date) return;
  //   (async () => {
  //     try {
  //       setLoading(true);
  //       setErr('');
  //       const params = new URLSearchParams();
  //       params.set('date', date);
  //       if (legacyStrict) params.set('legacy_strict', 'true');
  //       const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/pnl?${params.toString()}`;
  //       const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
  //       if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  //       const json = await resp.json();
  //       const rawRows = Array.isArray(json?.rows) ? json.rows : [];
  //       const remapGlCode = (code, name) => {
  //         const normalizedCode = String(code || '').trim();
  //         const normalizedName = String(name || '').toLowerCase();
  //         if (normalizedCode === '41000') {
  //           if (normalizedName.includes('short')) return '41200';
  //           return '41100';
  //         }
  //         return normalizedCode || code || '';
  //       };
  //       const normalizedRows = rawRows.map((r) => {
  //         const remappedCode = remapGlCode(r.gl_code ?? r.glNumber ?? r.glnumber, r.gl_name ?? r.glName);
  //         const code = String(remappedCode || '').trim();
  //         const existingCategory = typeof r.category === 'string' ? r.category : '';
  //         return {
  //           ...r,
  //           gl_code: remappedCode,
  //           glNumber: remappedCode,
  //           category: !existingCategory && (code === '41100' || code === '41200') ? 'Income' : existingCategory,
  //         };
  //       });
  //       setRows(normalizedRows);
  //     } catch (e) {
  //       console.error('[PnL] fetch failed', e);
  //       setErr('Failed to load P&L data.');
  //       setRows([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   })();
  // }, [show, fundId, date, legacyStrict]);

  useEffect(() => {
  if (!show || !fundId || !date) return;
  (async () => {
    try {
      setLoading(true);
      setErr('');

      const params = new URLSearchParams();
      params.set('date', date);
      if (legacyStrict) params.set('legacy_strict', 'true');

      const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/pnl?${params.toString()}`;
      const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const json = await resp.json();
      const rawRows = Array.isArray(json?.rows) ? json.rows : [];

      // 🔹 No remapping, take codes as-is from any of the known fields
      const normalizedRows = rawRows.map((r) => {
        const code =
          (r.gl_code ?? r.glNumber ?? r.glnumber ?? r.glCode ?? r.GLCode ?? '').toString().trim();
        return {
          ...r,
          gl_code: code,
          glNumber: code,
          // keep existing category untouched
        };
      });

      setRows(normalizedRows);
    } catch (e) {
      console.error('[PnL] fetch failed', e);
      setErr('Failed to load P&L data.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  })();
}, [show, fundId, date, legacyStrict]);

  const handleExportCsv = () => {
    if (!rows?.length) {
      alert('No P&L rows to export.');
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

    const csvContent = ['\ufeff' + headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `profit-loss-${fundId || 'fund'}-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXlsx = () => {
    if (!rows?.length) {
      alert('No P&L rows to export.');
      return;
    }
    const aoa = buildAoaFromHeaders(exportHeaders, rows, formatExportValue);
    exportAoaToXlsx({
      fileName: `profit-loss-${fundId || 'fund'}-${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'P&L',
      aoa,
    });
  };

  // group & totals
  const {
    incomeRows, expenseRows,
    incPTD, incMTD, incQTD, incYTD,
    expPTD, expMTD, expQTD, expYTD,
    netPTD, netMTD, netQTD, netYTD,
  } = useMemo(() => {
    const byCat = (cat) =>
      rows
        .filter(r => String(r.category || '').toLowerCase() === cat)
        // sort by numeric GL asc if possible
        .sort((a, b) => {
          const A = String(a.gl_code || a.glNumber || a.glnumber || '');
          const B = String(b.gl_code || b.glNumber || b.glnumber || '');
          const ai = /^\d+$/.test(A) ? parseInt(A, 10) : Number.POSITIVE_INFINITY;
          const bi = /^\d+$/.test(B) ? parseInt(B, 10) : Number.POSITIVE_INFINITY;
          return ai - bi || A.localeCompare(B);
        });

    const incomeRows = byCat('income');
    const expenseRows = byCat('expense');

    const sum = (arr, k) => arr.reduce((s, x) => s + Number(x?.[k] || 0), 0);

    // Calculate totals based on frequency
    const totals = {
      incomeRows,
      expenseRows,
      // Initialize all totals to 0
      incPTD: 0,
      incMTD: 0,
      incQTD: 0,
      incYTD: 0,
      expPTD: 0,
      expMTD: 0,
      expQTD: 0,
      expYTD: 0,
      netPTD: 0,
      netMTD: 0,
      netQTD: 0,
      netYTD: 0,
    };

    // PTD (only for daily frequency)
    if (reportingFrequency === 'daily') {
      totals.incPTD = sum(incomeRows, 'ptd_amount');
      totals.expPTD = sum(expenseRows, 'ptd_amount');
      totals.netPTD = totals.incPTD - totals.expPTD;
    }

    // MTD (for daily and monthly frequency)
    if (reportingFrequency === 'daily' || reportingFrequency === 'monthly') {
      totals.incMTD = sum(incomeRows, 'mtd_amount');
      totals.expMTD = sum(expenseRows, 'mtd_amount');
      totals.netMTD = totals.incMTD - totals.expMTD;
    }

    // QTD (for daily, monthly, and quarterly frequency)
    if (reportingFrequency === 'daily' || reportingFrequency === 'monthly' || reportingFrequency === 'quarterly' || reportingFrequency === 'quarter') {
      totals.incQTD = sum(incomeRows, 'qtd_amount');
      totals.expQTD = sum(expenseRows, 'qtd_amount');
      totals.netQTD = totals.incQTD - totals.expQTD;
    }

    // YTD (always available)
    totals.incYTD = sum(incomeRows, 'ytd_amount');
    totals.expYTD = sum(expenseRows, 'ytd_amount');
    totals.netYTD = totals.incYTD - totals.expYTD;

    return totals;
  }, [rows, reportingFrequency]);

  const renderSection = (title, data) => {
    // Get column headers based on frequency (excluding category, gl_code, gl_name)
    const amountColumns = exportHeaders.filter(h => 
      ['ptd_amount', 'mtd_amount', 'qtd_amount', 'ytd_amount'].includes(h.key)
    );
    
    return (
      <>
        <tr className="table-light">
          <th colSpan={2}>{title}</th>
          {amountColumns.map((col) => (
            <th key={col.key} className="text-end">{col.label}</th>
          ))}
        </tr>
        {data.map((r, idx) => (
          <tr key={`${title}-${idx}`}>
            <td style={{ width: 120 }}>{r.gl_code || r.glNumber || r.glnumber}</td>
            <td>{r.gl_name || r.glName}</td>
            {amountColumns.map((col) => (
              <td key={col.key} className="text-end">{fmt(r[col.key] || 0)}</td>
            ))}
          </tr>
        ))}
      </>
    );
  };

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={18} />
          PROFIT &amp; LOSS
          {reportingFrequency === 'daily' && ' – PTD / MTD / QTD / YTD'}
          {reportingFrequency === 'monthly' && ' – MTD / QTD / YTD'}
          {(reportingFrequency === 'quarterly' || reportingFrequency === 'quarter') && ' – QTD / YTD'}
          {(reportingFrequency === 'annual' || reportingFrequency === 'annually') && ' – YTD'}
          <span className="text-muted ms-2">{date || ''}</span>
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
                  {exportHeaders
                    .filter(h => ['ptd_amount', 'mtd_amount', 'qtd_amount', 'ytd_amount'].includes(h.key))
                    .map((col) => (
                      <th key={col.key} className="text-end">{col.label}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {/* INCOME */}
                {renderSection('INCOME', incomeRows)}
                <tr className="fw-semibold">
                  <td colSpan={2}>Total Income</td>
                  {exportHeaders
                    .filter(h => ['ptd_amount', 'mtd_amount', 'qtd_amount', 'ytd_amount'].includes(h.key))
                    .map((col) => {
                      const key = col.key;
                      let value = 0;
                      if (key === 'ptd_amount') value = incPTD;
                      else if (key === 'mtd_amount') value = incMTD;
                      else if (key === 'qtd_amount') value = incQTD;
                      else if (key === 'ytd_amount') value = incYTD;
                      return (
                        <td key={col.key} className="text-end">{fmt(value)}</td>
                      );
                    })}
                </tr>

                {/* EXPENSES */}
                {renderSection('EXPENSES', expenseRows)}
                <tr className="fw-semibold">
                  <td colSpan={2}>Total Expenses</td>
                  {exportHeaders
                    .filter(h => ['ptd_amount', 'mtd_amount', 'qtd_amount', 'ytd_amount'].includes(h.key))
                    .map((col) => {
                      const key = col.key;
                      let value = 0;
                      if (key === 'ptd_amount') value = expPTD;
                      else if (key === 'mtd_amount') value = expMTD;
                      else if (key === 'qtd_amount') value = expQTD;
                      else if (key === 'ytd_amount') value = expYTD;
                      return (
                        <td key={col.key} className="text-end">{fmt(value)}</td>
                      );
                    })}
                </tr>

                {/* NET INCOME */}
                <tr className="table-light fw-bold">
                  <td colSpan={2}>Net Income</td>
                  {exportHeaders
                    .filter(h => ['ptd_amount', 'mtd_amount', 'qtd_amount', 'ytd_amount'].includes(h.key))
                    .map((col) => {
                      const key = col.key;
                      let value = 0;
                      if (key === 'ptd_amount') value = netPTD;
                      else if (key === 'mtd_amount') value = netMTD;
                      else if (key === 'qtd_amount') value = netQTD;
                      else if (key === 'ytd_amount') value = netYTD;
                      return (
                        <td key={col.key} className="text-end">{fmt(value)}</td>
                      );
                    })}
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
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
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

// const ProfitLossModal = ({ show, handleClose }) => {
//   const columnDefs = [
//     { headerName: 'GL Number', field: 'glNumber', sortable: true, filter: true, flex: 1 },
//     { headerName: 'GL Name', field: 'glName', sortable: true, filter: true, flex: 1 },
//     { headerName: 'MTD', field: 'mtd', sortable: true, filter: true, flex: 1 },
//     { headerName: 'QTD', field: 'qtd', sortable: true, filter: true, flex: 1 },
//     { headerName: 'YTD', field: 'ytd', sortable: true, filter: true, flex: 1 },
//   ];

//   const rowData = [
//     { glNumber: '4001', glName: 'Revenue', mtd: 50000, qtd: 150000, ytd: 600000 },
//     { glNumber: '5001', glName: 'Cost of Goods Sold', mtd: 20000, qtd: 60000, ytd: 240000 },
//     { glNumber: '6001', glName: 'Operating Expenses', mtd: 10000, qtd: 30000, ytd: 120000 },
//     { glNumber: '7001', glName: 'Net Profit', mtd: 20000, qtd: 60000, ytd: 240000 },
//   ];

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> Profit & Loss (MTD, QTD, YTD)
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {/* ✅ Fix AG Grid Not Showing Inside Modal */}
//         <div className="ag-theme-alpine" style={{ height: 400, width: '100%', minWidth: '900px' }}>
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

// export default ProfitLossModal;