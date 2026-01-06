'use client';

import { useEffect, useMemo, useState, Fragment, useCallback } from 'react';
import Cookies from 'js-cookie';
import { Button, Modal, Table, Spinner, Form } from 'react-bootstrap';
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

/* ------------ helpers ------------ */
function toYMD(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeDate(input) {
  if (!input) return null;
  // already yyyy-mm-dd?
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  // try to parse anything else into yyyy-mm-dd
  const ymd = toYMD(input);
  return ymd;
}

// Read as text first to avoid "Unexpected end of JSON input"
async function fetchJSON(url, options) {
  const resp = await fetch(url, { ...options });
  const text = await resp.text();
  if (!resp.ok) {
    const preview = (text || '').slice(0, 400);
    throw new Error(`HTTP ${resp.status} ${resp.statusText} — ${preview}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    console.error('Invalid JSON from', url, '→', text.slice(0, 400));
    throw new Error(`Invalid JSON response from ${url}`);
  }
}

export default function LotSummaryModal({
  show,
  handleClose,
  fundId,
  date,                 // 'YYYY-MM-DD' (or parseable date)
  defaultScope = 'MTD', // MTD | QTD | YTD (deprecated - always uses MTD now)
  orgId,                // optional
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
  const [totalsBySymbol, setTotalsBySymbol] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const exportHeaders = useMemo(
    () => [
      { key: 'symbol_name', label: 'Symbol' },
      { key: 'lot_id', label: 'Lot ID' },
      { key: 'balance_quantity', label: 'Balance Quantity' },
      { key: 'cost_per_unit', label: 'Cost/Unit' },
      { key: 'amount', label: 'Amount' },
      { key: 'market_price', label: 'Market Price' },
      { key: 'market_value', label: 'Market Value' },
      { key: 'upnl', label: 'UPNL' },
    ],
    [],
  );
  const formatExportValue = (key, value) =>
    ['balance_quantity', 'cost_per_unit', 'amount', 'market_price', 'market_value', 'upnl'].includes(
      String(key),
    )
      ? fmt(value)
      : value ?? '';

  useEffect(() => {
    if (!show) return;

    // guard fundId
    const fOk = !!(fundId && String(fundId).trim());
    if (!fOk) {
      setErr('Missing fund.');
      setRows([]); setTotalsBySymbol([]);
      return;
    }

    // normalize date to yyyy-mm-dd (prevents 400)
    const normDate = normalizeDate(date);
    if (!normDate) {
      setErr('Invalid date. Use YYYY-MM-DD.');
      setRows([]); setTotalsBySymbol([]);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr('');

        const params = new URLSearchParams();
        params.set('date', normDate);
        params.set('scope', 'MTD'); // Fixed to MTD as scope selector is removed
        if (orgId) params.set('org_id', String(orgId));

        const url = `${apiBase}/api/v1/reports/${encodeURIComponent(fundId)}/lot-summary?${params.toString()}`;
        console.debug('[LotSummary] GET', url);

        const json = await fetchJSON(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!json) { setRows([]); setTotalsBySymbol([]); return; }

        const rs = json?.rows || json?.data?.rows || [];
        const ts = json?.totalsBySymbol || json?.data?.totalsBySymbol || [];
        setRows(Array.isArray(rs) ? rs : []);
        setTotalsBySymbol(Array.isArray(ts) ? ts : []);
      } catch (e) {
        console.error('[LotSummary] fetch failed', e);
        setErr(String(e.message || 'Failed to load Lot Summary.'));
        setRows([]); setTotalsBySymbol([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, fundId, date, orgId]);

  const handleExportCsv = () => {
    if (!rows?.length) {
      alert('No lot records to export.');
      return;
    }

    const headers = exportHeaders;

    const escapeCsv = (value) => {
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
      }
      return stringValue;
    };

    const formatValue = formatExportValue;

    const headerRow = headers.map(({ label }) => escapeCsv(label)).join(',');
    const dataRows = rows.map((row) =>
      headers
        .map(({ key }) => escapeCsv(formatValue(key, row[key])))
        .join(','),
    );

    const csvContent = ['\ufeff' + headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `lot-summary-${fundId || 'fund'}-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXlsx = () => {
    if (!rows?.length) {
      alert('No lot records to export.');
      return;
    }

    const aoa = buildAoaFromHeaders(exportHeaders, rows, formatExportValue);
    exportAoaToXlsx({
      fileName: `lot-summary-${fundId || 'fund'}-${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Lot Summary',
      aoa,
    });
  };

  // Group by symbol
  const { sections, grand } = useMemo(() => {
    const bySymbol = new Map();

    // seed with API totals (if any)
    for (const t of totalsBySymbol) {
      bySymbol.set(t.symbol_id, {
        symbol_id: t.symbol_id,
        symbol_name: t.symbol_name,
        rows: [],
        totals: {
          balance_quantity: Number(t.balance_quantity || 0),
          amount: Number(t.amount || 0),
          market_value: Number(t.market_value || 0),
          upnl: Number(t.upnl || 0),
        },
      });
    }

    for (const r0 of rows) {
      const r = {
        symbol_id: r0.symbol_id,
        symbol_name: r0.symbol_name,
        lot_id: r0.lot_id,
        balance_quantity: Number(r0.balance_quantity ?? r0.raw?.balance_quantity ?? 0),
        cost_per_unit: Number(
          r0.raw?.balance_quantity
            ? Number(r0.amount ?? 0) / Number(r0.raw?.balance_quantity || 1)
            : r0.cost_per_unit ?? 0,
        ),
        amount: Number(r0.amount ?? 0),
        market_price: Number(r0.market_price ?? 0),
        market_value: Number(r0.market_value ?? 0),
        upnl: Number(r0.upnl ?? 0),
        contract_size: Number(r0.contract_size ?? 1),
      };

      if (!bySymbol.has(r.symbol_id)) {
        bySymbol.set(r.symbol_id, {
          symbol_id: r.symbol_id,
          symbol_name: r.symbol_name,
          rows: [],
          totals: { balance_quantity: 0, amount: 0, market_value: 0, upnl: 0 },
        });
      }
      const sec = bySymbol.get(r.symbol_id);
      sec.rows.push(r);

      if (!totalsBySymbol.length) {
        sec.totals.balance_quantity += r.balance_quantity;
        sec.totals.amount          += r.amount;
        sec.totals.market_value    += r.market_value;
        sec.totals.upnl            += r.upnl;
      }
    }

    const sections = Array.from(bySymbol.values()).sort((a, b) =>
      String(a.symbol_name || '').localeCompare(String(b.symbol_name || ''))
    );
    for (const s of sections) {
      s.rows.sort((a, b) => String(a.lot_id || '').localeCompare(String(b.lot_id || '')));
    }

    const grand = sections.reduce((g, s) => ({
      balance_quantity: g.balance_quantity + s.totals.balance_quantity,
      amount:           g.amount + s.totals.amount,
      market_value:     g.market_value + s.totals.market_value,
      upnl:             g.upnl + s.totals.upnl,
    }), { balance_quantity: 0, amount: 0, market_value: 0, upnl: 0 });

    return { sections, grand };
  }, [rows, totalsBySymbol]);

  const renderSection = (sec) => (
    <Fragment key={sec.symbol_id}>
      <tr className="table-light">
        <th colSpan={8}>{sec.symbol_name}</th>
      </tr>
      {sec.rows.map((r, idx) => (
        <tr key={`${sec.symbol_id}-${r.lot_id}-${idx}`}>
          <td style={{ minWidth: 120 }}>{sec.symbol_name}</td>
          <td style={{ minWidth: 160 }}>{r.lot_id}</td>
          <td className="text-end">{fmt(r.balance_quantity)}</td>
          <td className="text-end">{fmt(r.cost_per_unit)}</td>
          <td className="text-end">{fmt(r.amount)}</td>
          <td className="text-end">{fmt(r.market_price)}</td>
          <td className="text-end">{fmt(r.market_value)}</td>
          <td className="text-end">{fmt(r.upnl)}</td>
        </tr>
      ))}
      <tr className="fw-semibold">
        <td colSpan={2}>Total</td>
        <td className="text-end">{fmt(sec.totals.balance_quantity)}</td>
        <td className="text-end">—</td>
        <td className="text-end">{fmt(sec.totals.amount)}</td>
        <td className="text-end">—</td>
        <td className="text-end">{fmt(sec.totals.market_value)}</td>
        <td className="text-end">{fmt(sec.totals.upnl)}</td>
      </tr>
    </Fragment>
  );

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye className="me-2" size={18} />
          Lot Summary <span className="text-muted ms-2">{normalizeDate(date) || ''}</span>
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
                  <th>Lot ID</th>
                  <th className="text-end">Balance Quantity</th>
                  <th className="text-end">Cost/Unit</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Market Price</th>
                  <th className="text-end">Market Value</th>
                  <th className="text-end">UPNL</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(renderSection)}

                <tr className="table-light fw-bold">
                  <td colSpan={2}>TOTAL</td>
                  <td className="text-end">{fmt(grand.balance_quantity)}</td>
                  <td className="text-end">—</td>
                  <td className="text-end">{fmt(grand.amount)}</td>
                  <td className="text-end">—</td>
                  <td className="text-end">{fmt(grand.market_value)}</td>
                  <td className="text-end">{fmt(grand.upnl)}</td>
                </tr>

                {!sections.length && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted">
                      No open lots in this period.
                    </td>
                  </tr>
                )}
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

// const LotSummaryModal = ({ show, handleClose }) => {
//   const columnDefs = [
//     { headerName: 'Symbol', field: 'symbol', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Lot ID', field: 'lotId', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Balance Quantity', field: 'balanceQty', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Cost/Unit', field: 'costPerUnit', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Amount', field: 'amount', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Market Price', field: 'marketPrice', sortable: true, filter: true, flex: 1 },
//     { headerName: 'Market Value', field: 'marketValue', sortable: true, filter: true, flex: 1 },
//     { headerName: 'UPNL', field: 'upnl', sortable: true, filter: true, flex: 1 },
//   ];

//   const rowData = [
//     { symbol: 'AAPL', lotId: 'L001', balanceQty: 100, costPerUnit: 150, amount: 15000, marketPrice: 155, marketValue: 15500, upnl: 500 },
//     { symbol: 'GOOGL', lotId: 'L002', balanceQty: 50, costPerUnit: 2800, amount: 140000, marketPrice: 2850, marketValue: 142500, upnl: 2500 },
//   ];

//   return (
//     <Modal show={show} onHide={handleClose} size="xl" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           <Eye className="me-2" size={20} /> Lot Summary
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {/* ✅ Fix AG Grid Not Showing Inside Modal */}
//         <div style={{ height: 400, width: '100%', minWidth: '900px' }}>
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

// export default LotSummaryModal;
