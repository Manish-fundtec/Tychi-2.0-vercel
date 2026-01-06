'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { Button, Modal, Table, Spinner } from 'react-bootstrap';
import { Eye } from 'lucide-react';
import { buildAoaFromHeaders, exportAoaToXlsx } from '@/lib/exporters/xlsx';
import { useDashboardToken } from '@/hooks/useDashboardToken';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders() {
  const token = Cookies.get('dashboardToken');
  const h = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function SalesPurchaseModal({
  show,
  handleClose,
  fundId,
  date,               // 'YYYY-MM-DD' (any day in the period; backend will window it)
  scope = 'monthly',  // 'monthly' | 'quarterly' (optional)
  reportingCurrency = '₹ ', // or pass from fund meta
}) {
  // Get decimal precision from dashboard token - same pattern as trades
  const dashboard = useDashboardToken();
  const decimalPrecision = useMemo(() => {
    const tokenPrecision = dashboard?.decimal_precision ?? dashboard?.fund?.decimal_precision
    const numPrecision = tokenPrecision !== null && tokenPrecision !== undefined ? Number(tokenPrecision) : null
    return numPrecision !== null && !isNaN(numPrecision) ? numPrecision : 2
  }, [dashboard])
  
  // Format function using decimal precision
  const fmt = useCallback((v) => {
    return Number(v || 0).toLocaleString('en-IN', { 
      minimumFractionDigits: decimalPrecision, 
      maximumFractionDigits: decimalPrecision 
    })
  }, [decimalPrecision])
  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const exportHeaders = useMemo(
    () => [
      { key: 'symbol', label: 'Symbol' },
      { key: 'open_long', label: 'Open Long' },
      { key: 'close_long', label: 'Close Long' },
      { key: 'open_short', label: 'Open Short' },
      { key: 'close_short', label: 'Close Short' },
    ],
    [],
  );
  const formatExportValue = useCallback((key, value) =>
    ['open_long', 'close_long', 'open_short', 'close_short'].includes(String(key))
      ? `${reportingCurrency}${fmt(value)}`
      : value ?? '', [fmt, reportingCurrency]);

  useEffect(() => {
    if (!show || !fundId || !date) return;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const params = new URLSearchParams();
        params.set('date', date);
        if (scope) params.set('scope', scope);
        const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/sales-purchase?${params.toString()}`;
        const resp = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        setRows(Array.isArray(json?.rows) ? json.rows : []);
      } catch (e) {
        console.error('[S&P] fetch failed', e);
        setErr('Failed to load Sales & Purchase data.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, fundId, date, scope]);

  const handleExportCsv = () => {
    if (!rows?.length) {
      alert('No sales & purchase rows to export.');
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
    link.download = `sales-purchase-${fundId || 'fund'}-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXlsx = () => {
    if (!rows?.length) {
      alert('No sales & purchase rows to export.');
      return;
    }

    const aoa = buildAoaFromHeaders(exportHeaders, rows, formatExportValue);
    exportAoaToXlsx({
      fileName: `sales-purchase-${fundId || 'fund'}-${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Sales & Purchase',
      aoa,
    });
  };

  const totals = useMemo(() => {
    const sum = (k) => rows.reduce((s, r) => s + Number(r?.[k] || 0), 0);
    return {
      open_long:  sum('open_long'),
      close_long: sum('close_long'),
      open_short: sum('open_short'),
      close_short:sum('close_short'),
    };
  }, [rows]);

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={18} />
          SALES &amp; PURCHASE SUMMARY <span className="text-muted ms-2">{date || ''}</span>
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
                  <th>Symbol</th>
                  <th className="text-end">Open Long</th>
                  <th className="text-end">Close Long</th>
                  <th className="text-end">Open Short</th>
                  <th className="text-end">Close Short</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: 'left' }}>{r.symbol}</td>
                    <td className="text-end">{reportingCurrency}{fmt(r.open_long)}</td>
                    <td className="text-end">{reportingCurrency}{fmt(r.close_long)}</td>
                    <td className="text-end">{reportingCurrency}{fmt(r.open_short)}</td>
                    <td className="text-end">{reportingCurrency}{fmt(r.close_short)}</td>
                  </tr>
                ))}
                <tr className="table-light fw-semibold">
                  <td>Total</td>
                  <td className="text-end">{reportingCurrency}{fmt(totals.open_long)}</td>
                  <td className="text-end">{reportingCurrency}{fmt(totals.close_long)}</td>
                  <td className="text-end">{reportingCurrency}{fmt(totals.open_short)}</td>
                  <td className="text-end">{reportingCurrency}{fmt(totals.close_short)}</td>
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

// const PurchaseSalesModal = ({ show, handleClose }) => {
//   const columnDefs = [
//     { headerName: 'Month', field: 'month', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Ticker', field: 'ticker', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Open Long', field: 'open_long', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Close Long', field: 'close_long', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Open Short', field: 'open_short', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Close Short', field: 'close_short', sortable: true, filter: true, flex: 1 },
//   ];

//   const rowData = [
//     { month: 'January', ticker: 'AAPL', open_long: 100, close_long: 50, open_short: 30, close_short: 20 },
//     { month: 'February', ticker: 'GOOGL', open_long: 80, close_long: 40, open_short: 20, close_short: 10 },
//     { month: 'March', ticker: 'TSLA', open_long: 90, close_long: 45, open_short: 25, close_short: 15 },
//   ];

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> Purchase and Sales
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

// export default PurchaseSalesModal;