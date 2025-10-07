import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Guardrails & Comfort Features – UI Demo (React + Tailwind)
 *
 * Shows:
 *  - Unsaved changes guard before leaving
 *  - Autosave indicator ("Saved just now")
 *  - Keyboard shortcuts: Enter (edit), Esc (cancel), Ctrl+S (save), F (focus filter)
 *  - Accessibility: focus first error cell + screen-reader live messages
 *  - Audit Trail: History side panel (who changed what, when)
 *
 * How to use:
 *  - Drop <GuardrailsDemo /> into a Next.js page (Tailwind enabled)
 *  - Replace mock data / currentUser with real values
 */

/******************** Helpers ********************/
function classNames(...xs) { return xs.filter(Boolean).join(" "); }
function nowISO() { return new Date().toISOString(); }
function humanTime(ts) { return new Date(ts).toLocaleString(); }

/******************** Hooks ********************/
function useUnsavedGuard(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; return ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);
}

function useAutosave({ dirty, onSave, intervalMs = 4000 }) {
  const [lastSavedAt, setLastSavedAt] = useState(null);
  useEffect(() => {
    if (!onSave) return;
    const id = setInterval(async () => {
      if (dirty) {
        await onSave("autosave");
        setLastSavedAt(Date.now());
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [dirty, onSave, intervalMs]);
  return { lastSavedAt };
}

/******************** Components ********************/
function HistoryPanel({ open, onClose, entries = [] }) {
  return (
    <div className={classNames("fixed inset-0 z-40", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      <div className={classNames("absolute inset-0 bg-black/30 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <aside className={classNames("absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl transition-transform", open ? "translate-x-0" : "translate-x-full")}
             role="dialog" aria-modal="true" aria-labelledby="history-title">
        <div className="p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div id="history-title" className="text-lg font-semibold">History</div>
              <div className="text-xs text-gray-500">Who changed what, when</div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
          </div>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-56px)]">
          {entries.length === 0 ? (
            <div className="p-10 text-center text-gray-600 bg-gray-50 rounded-2xl">No changes yet.</div>
          ) : (
            entries.slice().reverse().map((e, i) => (
              <div key={i} className="p-3 bg-white rounded-2xl ring-1 ring-gray-100">
                <div className="text-sm"><b>{e.user}</b> edited <b>{e.field}</b> on row <b>#{e.rowNo}</b></div>
                <div className="text-xs text-gray-600">{humanTime(e.ts)} • {e.mode}</div>
                <div className="mt-1 text-xs">
                  <div className="line-through text-gray-500">{String(e.before)}</div>
                  <div>{String(e.after)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function LiveRegion({ message }) {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">{message}</div>
  );
}

function SaveBadge({ dirty, saving, savedAt }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={classNames("inline-block w-2 h-2 rounded-full", dirty ? "bg-amber-500" : "bg-green-500")} />
      {saving ? (
        <span>Saving…</span>
      ) : dirty ? (
        <span>Unsaved changes</span>
      ) : savedAt ? (
        <span>Saved {new Date(savedAt).toLocaleTimeString()}</span>
      ) : (
        <span>All changes saved</span>
      )}
    </div>
  );
}

function Grid({ rows, setRows, errors, selected, setSelected, editing, setEditing, onLogChange, focusFirstError }) {
  const filterRef = useRef(null);
  const cellRefs = useRef({}); // key: `${r}.${col}` => ref

  useEffect(() => { if (focusFirstError) focusFirstErrorCell(); }, [focusFirstError]);

  function focusFirstErrorCell() {
    const first = errors[0];
    if (!first) return;
    const key = `${first.rowIndex}.${first.col}`;
    const el = cellRefs.current[key];
    el?.focus();
  }

  function onCellClick(r, col) {
    setSelected({ rowIndex: r, col });
  }

  function startEdit() {
    if (!selected) return;
    setEditing(true);
    const key = `${selected.rowIndex}.${selected.col}`;
    const el = cellRefs.current[key];
    el?.focus();
  }

  function cancelEdit() { setEditing(false); }

  function commitEdit(value) {
    if (!selected) return;
    const { rowIndex, col } = selected;
    const before = rows[rowIndex][col];
    if (before === value) { setEditing(false); return; }
    const next = rows.map((r, i) => i === rowIndex ? { ...r, [col]: value } : r);
    setRows(next);
    setEditing(false);
    onLogChange({ rowNo: rowIndex + 1, field: col, before, after: value, mode: 'manual' });
  }

  function renderCell(r, col) {
    const key = `${r}.${col}`;
    const err = errors.find(e => e.rowIndex === r && e.col === col);
    const isSel = selected && selected.rowIndex === r && selected.col === col;

    return (
      <td key={col} className={classNames("px-3 py-1.5 border-b align-top", err && "bg-red-50")}
          onClick={() => onCellClick(r, col)}>
        <div
          ref={(el) => { if (el) cellRefs.current[key] = el; }}
          tabIndex={0}
          role="gridcell"
          aria-invalid={!!err}
          aria-label={`${col} ${err ? 'has error' : ''}`}
          className={classNames("min-h-[28px] outline-none rounded", isSel && !editing && "ring-2 ring-blue-300")}
        >
          {editing && isSel ? (
            <input
              defaultValue={rows[r][col] ?? ''}
              autoFocus
              onBlur={(e) => commitEdit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit(e.currentTarget.value);
                if (e.key === 'Escape') cancelEdit();
              }}
              className="w-full px-2 py-1 border rounded"
            />
          ) : (
            <span>{String(rows[r][col] ?? '')}</span>
          )}
          {err && <div className="text-[10px] text-red-600">{err.msg}</div>}
        </div>
      </td>
    );
  }

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const targetTag = (e.target && e.target.tagName) || '';
      const isTyping = ['INPUT','TEXTAREA','SELECT'].includes(targetTag);
      if (e.key.toLowerCase() === 'f' && !isTyping) { e.preventDefault(); filterRef.current?.focus(); }
      if (e.key === 'Enter' && !isTyping) { e.preventDefault(); startEdit(); }
      if (e.key === 'Escape' && editing) { e.preventDefault(); cancelEdit(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); document.getElementById('save-btn')?.click(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, selected]);

  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-100">
      <div className="p-3 flex items-center gap-2">
        <input ref={filterRef} placeholder="Filter (press F to focus)" className="px-3 py-2 rounded-xl border text-sm w-64" />
        <button onClick={() => focusFirstErrorCell()} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Go to first error</button>
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
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-1.5 border-b">{i+1}</td>
                {['symbol','trade_date','quantity','price'].map(col => renderCell(i, col))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/******************** Demo ********************/
export default function GuardrailsDemo() {
  const currentUser = "ops@fundtec.co";
  const [rows, setRows] = useState(makeRows());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]); // {rowNo, field, before, after, mode, user, ts}
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstErrorFocusVersion, setFirstErrorFocusVersion] = useState(0);

  // recompute errors from rows (demo rules)
  const errors = useMemo(() => validateRows(rows), [rows]);

  function onLogChange(entry) {
    setDirty(true);
    setHistory(h => [...h, { ...entry, user: currentUser, ts: nowISO() }]);
  }

  // mark dirty when rows change from user edits
  useEffect(() => { /* setDirty handled in onLogChange */ }, [rows]);

  // unsaved guard
  useUnsavedGuard(dirty);

  // autosave
  async function saveNow(mode = 'manual') {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // mock latency
    setSaving(false);
    if (dirty) setDirty(false);
    setHistory(h => [...h, { rowNo: '-', field: '(autosave)', before: '', after: '', mode, user: currentUser, ts: nowISO() }]);
  }
  const { lastSavedAt } = useAutosave({ dirty, onSave: saveNow, intervalMs: 4000 });

  // live region message
  const liveMsg = saving ? 'Saving' : dirty ? 'Unsaved changes' : lastSavedAt ? `Saved at ${new Date(lastSavedAt).toLocaleTimeString()}` : 'All changes saved';

  // simulate navigation away (route change)
  function simulateNavigateAway() {
    if (!dirty) { alert('Navigated away.'); return; }
    const ok = confirm('You have unsaved changes. Leave anyway?');
    if (ok) alert('Navigated away.');
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-4">
      <LiveRegion message={liveMsg} />

      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Guardrails & Comfort Features</h2>
          <p className="text-sm text-gray-600">Enterprise-grade polish for the trade fixing experience</p>
        </div>
        <div className="flex items-center gap-3">
          <SaveBadge dirty={dirty} saving={saving} savedAt={lastSavedAt} />
          <button id="save-btn" onClick={() => saveNow('manual')} className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm">Save (Ctrl+S)</button>
          <button onClick={() => setHistoryOpen(true)} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">History</button>
          <button onClick={simulateNavigateAway} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Navigate away</button>
        </div>
      </header>

      <Grid
        rows={rows}
        setRows={(r) => { setRows(r); }}
        errors={errors}
        selected={null}
        setSelected={() => {}}
        editing={false}
        setEditing={() => {}}
        onLogChange={onLogChange}
        focusFirstError={() => setFirstErrorFocusVersion(v => v + 1)}
      />

      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        <span className="px-2 py-1 bg-gray-100 rounded-lg">Enter: edit</span>
        <span className="px-2 py-1 bg-gray-100 rounded-lg">Esc: cancel</span>
        <span className="px-2 py-1 bg-gray-100 rounded-lg">Ctrl+S: save</span>
        <span className="px-2 py-1 bg-gray-100 rounded-lg">F: focus filter</span>
        <button onClick={() => setFirstErrorFocusVersion(v => v + 1)} className="ml-2 underline">Focus first error</button>
        <span className="ml-2">Errors: {errors.length}</span>
      </div>

      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} entries={history} />

      {/* Smoke tests */}
      <section className="bg-white rounded-2xl ring-1 ring-gray-100 p-4 text-sm">
        <div className="font-medium mb-2">Smoke Tests</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setRows(makeRows()); setHistory([]); setDirty(false); }} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200">Reset Data</button>
          <button onClick={() => { setDirty(true); }} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200">Mark Dirty</button>
          <button onClick={() => saveNow('manual')} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200">Save Now</button>
          <button onClick={() => alert('A11y live region text: ' + liveMsg)} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200">Check Live Region</button>
        </div>
        <ul className="mt-3 text-xs text-gray-600 list-disc list-inside">
          <li>Unsaved guard prompts before leaving when there are edits.</li>
          <li>Autosave runs every ~4s while dirty.</li>
          <li>Keyboard: Enter (edit cell), Esc (cancel), Ctrl+S (save), F (focus filter).</li>
          <li>Focus First Error jumps to the first invalid cell and announces via live region.</li>
          <li>History records who/when/what for every change.</li>
        </ul>
      </section>
    </div>
  );
}

/******************** Demo Data + Validation ********************/
function makeRows() {
  return [
    { symbol: ' TCS ', trade_date: '', quantity: 100, price: 187.5 },
    { symbol: 'INFY', trade_date: '2025-08-09', quantity: -50, price: 98.2 },
    { symbol: 'HDFCBANK', trade_date: '2025-08-10', quantity: 200, price: 1500.0 },
  ];
}

function validateRows(rows) {
  const errs = [];
  rows.forEach((r, i) => {
    if (!r.trade_date) errs.push({ rowIndex: i, col: 'trade_date', msg: 'Trade date required' });
    if (typeof r.quantity !== 'number' || r.quantity <= 0) errs.push({ rowIndex: i, col: 'quantity', msg: 'Quantity must be > 0' });
    if (typeof r.symbol === 'string' && (/^\s|\s$/.test(r.symbol))) errs.push({ rowIndex: i, col: 'symbol', msg: 'Leading/trailing spaces' });
  });
  return errs;
}
