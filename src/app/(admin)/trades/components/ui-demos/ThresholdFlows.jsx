import React, { useEffect, useMemo, useState } from "react";
// Note: For AG Grid, install deps in your project: `npm i ag-grid-community ag-grid-react`
// and make sure Tailwind is enabled. This file is a demo scaffold you can copy into Next.js.

/**
 * WHAT THIS FILE SHOWS
 * 1) QuickFixDrawer (≤5 errors): right-side drawer with minimal inline editors
 * 2) FixModeGrid (6–50 errors): AG Grid-powered bulk edit screen with toolbar
 * 3) WorkbookFlow (51+ errors): Download error workbook + Re-upload "Correction"
 * 4) ThresholdDemo: picks a UI based on error count and shows it
 *
 * DATA MODEL (example per row)
 * {
 *   buffer_id: "UUID",
 *   row_no: 12,
 *   trade_date: "2025-08-10",
 *   symbol: "AAPL",
 *   quantity: 100,
 *   price: 187.5,
 *   broker: "Zerodha",
 *   error_codes: ["MISSING_DATE"],
 *   error_message: "Trade Date missing or invalid",
 * }
 */

/********************
 * 1) Quick Fix Drawer
 ********************/
function Field({ label, children }) {
  return (
    <label className="text-xs text-gray-600 w-full">
      <span className="block mb-1">{label}</span>
      {children}
    </label>
  );
}

function ErrorBadge({ code }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] mr-1 mb-1">
      {code}
    </span>
  );
}

export function QuickFixDrawer({ open, onClose, rows = [], onSave, onRevalidate }) {
  const [drafts, setDrafts] = useState(rows);

  useEffect(() => setDrafts(rows), [rows]);

  function update(idx, field, value) {
    setDrafts(d => d.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      {/* Panel */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl p-5 transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Quick Fix ({rows.length} {rows.length === 1 ? 'row' : 'rows'})</h3>
            <p className="text-xs text-gray-600">Fix a few errors inline, then revalidate.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>

        <div className="space-y-4 overflow-y-auto h-[70vh] pr-1">
          {drafts.map((r, idx) => (
            <div key={r.buffer_id || idx} className="p-3 rounded-2xl ring-1 ring-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Row #{r.row_no ?? idx + 1}</div>
                <div className="text-xs text-gray-500">buffer_id: {r.buffer_id?.slice(0,8) || '—'}</div>
              </div>

              {/* Error badges */}
              <div className="mb-2">
                {(r.error_codes || []).map((c, i) => <ErrorBadge key={i} code={c} />)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Trade Date (YYYY-MM-DD)">
                  <input value={drafts[idx].trade_date || ''} onChange={(e) => update(idx, 'trade_date', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                </Field>
                <Field label="Symbol">
                  <input value={drafts[idx].symbol || ''} onChange={(e) => update(idx, 'symbol', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                </Field>
                <Field label="Quantity">
                  <input type="number" value={drafts[idx].quantity ?? ''} onChange={(e) => update(idx, 'quantity', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                </Field>
                <Field label="Price">
                  <input type="number" step="0.0001" value={drafts[idx].price ?? ''} onChange={(e) => update(idx, 'price', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                </Field>
                <Field label="Broker">
                  <input value={drafts[idx].broker || ''} onChange={(e) => update(idx, 'broker', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                </Field>
              </div>

              {r.error_message && (
                <div className="mt-2 text-xs text-red-600">{r.error_message}</div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={() => onSave?.(drafts)} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Save changes</button>
          <button onClick={() => onRevalidate?.()} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Revalidate</button>
        </div>
      </div>
    </div>
  );
}

/********************
 * 2) Fix Mode – AG Grid
 ********************/
// This is a placeholder table; swap with AG Grid in your app.
function SimpleTable({ rows, onBulkTrim, onRevalidate }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-100">
      <div className="flex items-center justify-between p-3">
        <div className="text-sm text-gray-600">Showing {rows.length} rows</div>
        <div className="flex gap-2">
          <button onClick={onBulkTrim} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Trim spaces</button>
          <button onClick={onRevalidate} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm">Revalidate</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Trade Date</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Broker</th>
              <th className="px-3 py-2">Errors</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map((r, i) => (
              <tr key={r.buffer_id || i} className={(r.error_codes?.length ? 'bg-red-50' : '') + ' border-b'}>
                <td className="px-3 py-2">{r.row_no ?? i+1}</td>
                <td className="px-3 py-2">{r.symbol}</td>
                <td className="px-3 py-2">{r.trade_date}</td>
                <td className="px-3 py-2">{r.quantity}</td>
                <td className="px-3 py-2">{r.price}</td>
                <td className="px-3 py-2">{r.broker}</td>
                <td className="px-3 py-2">
                  {(r.error_codes || []).map((c, j) => <ErrorBadge key={j} code={c} />)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FixModeGrid({ rows = [], onBulkTrim, onRevalidate }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fix Mode (Bulk Edit)</h3>
          <p className="text-xs text-gray-600">Best for 6–50 errors. Use filters, bulk actions, and revalidate.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBulkTrim} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Trim all spaces</button>
          <button onClick={onRevalidate} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm">Revalidate all</button>
        </div>
      </div>
      {/* Swap this with AG Grid in your app for real editing/filtering */}
      <SimpleTable rows={rows} onBulkTrim={onBulkTrim} onRevalidate={onRevalidate} />
    </div>
  );
}

/********************
 * 3) Workbook Flow (51+ errors)
 ********************/
export function WorkbookFlow({ errorCount = 0, onDownload, onUploadCorrection, lastWorkbookUrl }) {
  const [file, setFile] = useState(null);
  return (
    <div className="p-5 bg-white rounded-2xl ring-1 ring-gray-100">
      <h3 className="text-lg font-semibold">Heavy Errors Detected ({errorCount})</h3>
      <p className="text-sm text-gray-600">Best for 51+ errors. Download workbook, fix in Excel, and re-upload as a Correction.</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={onDownload} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Download Error Workbook</button>
        {lastWorkbookUrl && (
          <a href={lastWorkbookUrl} target="_blank" rel="noreferrer" className="text-xs underline text-gray-600">View last workbook</a>
        )}
      </div>

      <div className="mt-4 p-4 rounded-xl bg-gray-50">
        <div className="text-xs text-gray-600 mb-2">Re-upload Correction (must contain hidden <code>buffer_id</code> column)</div>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setFile(e.target.files?.[0] || null)} className="block" />
        <div className="mt-2 flex gap-2">
          <button disabled={!file} onClick={() => onUploadCorrection?.(file)} className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50">Upload Correction</button>
          {file && <div className="text-xs text-gray-600">{file.name}</div>}
        </div>
      </div>

      <ul className="mt-3 text-xs text-gray-600 list-disc list-inside">
        <li>Only the errored rows are included in the workbook.</li>
        <li>Do not remove the hidden <code>buffer_id</code> column; it maps fixes to rows.</li>
        <li>Use the dropdowns for Broker/Symbol if present.</li>
      </ul>
    </div>
  );
}

/********************
 * 4) Demo – Threshold switching
 ********************/
export default function ThresholdDemo() {
  // Fake API data: tweak length to see different UIs
  const [rows, setRows] = useState(() => makeFakeRows(12));
  const errorCount = rows.length;

  function onSaveQuickFix(drafts) {
    // POST /api/trades/buffer/patch  { rows: drafts }
    alert(`Saved ${drafts.length} row(s). Now revalidate…`);
  }
  function onRevalidate() {
    // POST /api/trades/jobs/:job_id/revalidate
    alert('Revalidating…');
  }
  function onBulkTrim() {
    setRows(cur => cur.map(r => ({
      ...r,
      symbol: (r.symbol || '').trim(),
      broker: (r.broker || '').trim(),
    })));
  }
  function onDownload() {
    // GET /api/trades/jobs/:job_id/error-workbook → file
    alert('Downloading workbook…');
  }
  function onUploadCorrection(file) {
    // POST /api/trades/jobs/:job_id/correction  (multipart)
    alert(`Uploading correction: ${file.name}`);
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Threshold Demo</h2>
        <div className="flex items-center gap-2 text-sm">
          <span>Errors: </span>
          <button onClick={() => setRows(makeFakeRows(3))} className="px-2 py-1 rounded-md bg-gray-100">3</button>
          <button onClick={() => setRows(makeFakeRows(12))} className="px-2 py-1 rounded-md bg-gray-100">12</button>
          <button onClick={() => setRows(makeFakeRows(88))} className="px-2 py-1 rounded-md bg-gray-100">88</button>
        </div>
      </div>

      {errorCount <= 5 && (
        <QuickFixDrawer open={true} onClose={() => {}} rows={rows} onSave={onSaveQuickFix} onRevalidate={onRevalidate} />
      )}

      {errorCount > 5 && errorCount <= 50 && (
        <FixModeGrid rows={rows} onBulkTrim={onBulkTrim} onRevalidate={onRevalidate} />
      )}

      {errorCount > 50 && (
        <WorkbookFlow errorCount={errorCount} onDownload={onDownload} onUploadCorrection={onUploadCorrection} />
      )}

      {/* Tip box */}
      <div className="p-3 text-xs text-gray-600 bg-white rounded-2xl ring-1 ring-gray-100">
        Rule of thumb: ≤5 → Quick Fix, 6–50 → Grid Fix Mode, 51+ → Workbook.
      </div>
    </div>
  );
}

/********************
 * Helper – Fake data
 ********************/
function makeFakeRows(n) {
  const rows = [];
  for (let i = 1; i <= n; i++) {
    rows.push({
      buffer_id: cryptoRandom(12),
      row_no: i,
      trade_date: i % 4 === 0 ? '' : `2025-08-${String((i%28)+1).padStart(2,'0')}`,
      symbol: i % 3 === 0 ? ' TCS ' : 'INFY',
      quantity: i % 5 === 0 ? -100 : 100,
      price: 187.5,
      broker: i % 2 === 0 ? ' Zerodha ' : 'AngelOne',
      error_codes: [i % 4 === 0 ? 'MISSING_DATE' : 'TRIM_SPACE'],
      error_message: i % 4 === 0 ? 'Trade Date missing or invalid' : 'Leading/trailing spaces detected',
    });
  }
  return rows;
}

function cryptoRandom(len = 8) {
  const chars = 'abcdef0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
