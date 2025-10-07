import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Notification System for a Fund-Accounting app
 * - Toasts: small, auto-dismissing alerts in the corner
 * - Notification Center: slide-over panel with per-upload timelines
 *
 * Tech: React + TailwindCSS
 * No external libs. Copy into your Next.js project and wire actions.
 *
 * ✅ Fixes
 * - Removed stray `$1` token that caused `ReferenceError: $1 is not defined`.
 * - Avoids using a bare `type` identifier in helpers (renamed to `evtType`).
 * - Escapes example code blocks inside JSX using template strings.
 *
 * ✅ Demo + Basic Tests
 * - Buttons simulate typical flows (Validate with errors, Ready, Aborted, Failed).
 * - "Run Smoke Tests" exercises provider APIs and asserts basic invariants.
 */

/**********************
 * Provider + Context
 **********************/
const NotifCtx = createContext(null);

export function NotificationsProvider({ children }) {
  const [toasts, setToasts] = useState([]); // {id, type, title, message, actionLabel, onAction, ttl}
  const [open, setOpen] = useState(false);  // Notification Center visibility
  const [jobs, setJobs] = useState([]);     // [{jobId, fileName, events: [{ts, type, meta}], unread: bool}]

  // --- Toasts API ---
  function addToast(t) {
    const id = t.id || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const ttl = t.ttl ?? 4000;
    const toast = { id, type: t.type || 'info', title: t.title || '', message: t.message || '', actionLabel: t.actionLabel, onAction: t.onAction, ttl };
    setToasts(prev => [...prev, toast]);
    if (ttl > 0) setTimeout(() => dismissToast(id), ttl);
    return id;
  }
  function dismissToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  // --- Jobs & Events API ---
  function upsertJob(jobId, patch) {
    setJobs(prev => {
      const i = prev.findIndex(j => j.jobId === jobId);
      if (i === -1) return [...prev, { jobId, fileName: patch.fileName || 'unknown.xlsx', events: [], unread: true, ...patch }];
      const j = prev[i];
      const updated = { ...j, ...patch };
      const next = prev.slice(); next[i] = updated; return next;
    });
  }
  function pushJobEvent(jobId, event) {
    const evt = { ts: event.ts || new Date().toISOString(), type: event.type || 'info', meta: event.meta || {} };
    setJobs(prev => {
      const i = prev.findIndex(j => j.jobId === jobId);
      if (i === -1) return [...prev, { jobId, fileName: event.fileName || 'unknown.xlsx', events: [evt], unread: true }];
      const j = prev[i];
      const updated = { ...j, events: [...j.events, evt], unread: true };
      const next = prev.slice(); next[i] = updated; return next;
    });
  }
  function markAllRead() {
    setJobs(prev => prev.map(j => ({ ...j, unread: false })));
  }

  const unreadCount = useMemo(() => jobs.reduce((acc, j) => acc + (j.unread ? 1 : 0), 0), [jobs]);

  const value = { toasts, addToast, dismissToast, open, setOpen, jobs, upsertJob, pushJobEvent, markAllRead, unreadCount };
  return (
    <NotifCtx.Provider value={value}>
      {children}
      <Toasts />
      <NotificationCenter />
    </NotifCtx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotifCtx);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

/**********************
 * Toasts
 **********************/
const TOAST_STYLES = {
  info:    'bg-white ring-1 ring-blue-100 text-blue-900',
  success: 'bg-white ring-1 ring-green-100 text-green-900',
  warning: 'bg-white ring-1 ring-amber-100 text-amber-900',
  error:   'bg-white ring-1 ring-red-100 text-red-900',
};
const TOAST_ICON = { info: 'ℹ', success: '✔', warning: '⚠', error: '⛔' };

function Toasts() {
  const { toasts, dismissToast } = useNotifications();
  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 w-[320px]" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-start gap-3 p-3 rounded-2xl shadow-sm ${TOAST_STYLES[t.type] || TOAST_STYLES.info}`}>
          <div className="text-base leading-none mt-[2px]">{TOAST_ICON[t.type] || TOAST_ICON.info}</div>
          <div className="flex-1">
            {t.title && <div className="font-medium text-sm">{t.title}</div>}
            {t.message && <div className="text-xs opacity-80 mt-0.5">{t.message}</div>}
            {t.actionLabel && (
              <button onClick={() => { t.onAction?.(); }} className="mt-2 text-xs underline">
                {t.actionLabel}
              </button>
            )}
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

/**********************
 * Notification Bell (for navbar)
 **********************/
export function NotificationBell() {
  const { unreadCount, setOpen } = useNotifications();
  return (
    <button onClick={() => setOpen(true)} className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200">
      <span aria-hidden="true">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white ring-2 ring-white">{unreadCount}</span>
      )}
      <span className="sr-only">Open notifications</span>
    </button>
  );
}

/**********************
 * Notification Center – slide-over panel
 **********************/
function EventLine({ e, onAction }) {
  const { type: evtType, meta, ts } = e;
  const label = humanizeEvent(evtType, meta);
  const when = new Date(ts).toLocaleString();
  const action = eventAction(evtType, meta);
  return (
    <div className="relative pl-6">
      <div className="absolute left-0 top-1 w-3 h-3 rounded-full ring-2 ring-white" title={evtType + ''} style={{ background: dotColor(evtType) }} />
      <div className="text-sm">{label}</div>
      <div className="text-[11px] text-gray-500">{when}</div>
      {action && (
        <button onClick={() => onAction?.(action)} className="mt-1 text-xs underline">{action.label}</button>
      )}
    </div>
  );
}

function JobTimeline({ job, onAction }) {
  return (
    <div className="p-3 bg-white rounded-2xl ring-1 ring-gray-100">
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-sm text-gray-500">{job.jobId}</div>
          <div className="font-medium">{job.fileName}</div>
        </div>
        {job.unread && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">New</span>}
      </div>
      <div className="relative pl-4">
        <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-2">
          {(job.events || []).map((e, i) => (
            <EventLine key={i} e={e} onAction={(a) => onAction?.(job, e, a)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationCenter() {
  const { open, setOpen, jobs, markAllRead } = useNotifications();
  useEffect(() => { if (open) markAllRead(); }, [open]);

  return (
    <div className={`fixed inset-0 z-[55] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      {/* Panel */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-xl bg-gray-50 shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Notifications</div>
              <div className="text-xs text-gray-500">Timeline per upload (Uploaded → Parsed → Validated → Errors found → Revalidated)</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800">✕</button>
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-56px)]">
          {jobs.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl ring-1 ring-gray-100 text-gray-600">No notifications yet.</div>
          ) : (
            jobs.slice().reverse().map(job => (
              <JobTimeline key={job.jobId} job={job} onAction={(job, e, a) => handleCenterAction(job, e, a)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function handleCenterAction(job, e, action) {
  // Replace these with real navigations / calls
  if (action?.key === 'review') alert(`Open Review for job ${job.jobId}`);
  if (action?.key === 'grid') alert(`Open Fix in Grid for job ${job.jobId}`);
  if (action?.key === 'download') alert(`Download workbook for job ${job.jobId}`);
  if (action?.key === 'post') alert(`Post to GL for job ${job.jobId}`);
}

/**********************
 * Helpers
 **********************/
function dotColor(evtType) {
  if (evtType === 'uploaded' || evtType === 'info') return '#60a5fa'; // blue-400
  if (evtType === 'parsed' || evtType === 'buffered') return '#6366f1'; // indigo
  if (evtType === 'validated' || evtType === 'ready' || evtType === 'success') return '#22c55e'; // green-500
  if (evtType === 'errors_found' || evtType === 'warning') return '#f59e0b'; // amber-500
  if (evtType === 'failed' || evtType === 'aborted' || evtType === 'error') return '#ef4444'; // red-500
  return '#9ca3af';
}

function humanizeEvent(evtType, meta = {}) {
  switch (evtType) {
    case 'uploaded': return `Uploaded (${meta.fileSize || '—'})`;
    case 'parsed': return `Parsed: ${meta.rowsParsed ?? '—'} rows`;
    case 'buffered': return `Buffered: ${meta.rowsBuffered ?? '—'} rows`;
    case 'validated': return `Validation finished: ${meta.errors ?? 0} errors, ${meta.warnings ?? 0} warnings`;
    case 'errors_found': return `${meta.errors ?? 0} error(s) found → needs fix`;
    case 'revalidated': return `Revalidated: ${meta.errors ?? 0} errors`;
    case 'ready': return `Ready to post to GL`;
    case 'aborted': return `Aborted (${meta.reason || '—'})`;
    case 'failed': return `Failed: ${meta.message || 'unknown error'}`;
    default: return String(evtType);
  }
}

function eventAction(evtType, meta = {}) {
  if (evtType === 'errors_found' || (evtType === 'validated' && (meta.errors || 0) > 0)) {
    if ((meta.errors || 0) <= 5) return { key: 'review', label: 'Review now' };
    if ((meta.errors || 0) <= 50) return { key: 'grid', label: 'Fix in Grid' };
    return { key: 'download', label: 'Download workbook' };
  }
  if (evtType === 'ready') return { key: 'post', label: 'Post to GL' };
  return null;
}

/**********************
 * Demo – wire it up fast + test scenarios
 **********************/
export default function DemoNotifications() {
  return (
    <NotificationsProvider>
      <DemoPage />
    </NotificationsProvider>
  );
}

function DemoPage() {
  const { addToast, setOpen, pushJobEvent, upsertJob } = useNotifications();
  const jobId = 'J-24001';
  const fileName = 'trades_2025-08-10.xlsx';

  useEffect(() => {
    upsertJob(jobId, { fileName });
  }, []);

  function simulateFlow() {
    pushJobEvent(jobId, { type: 'uploaded', meta: { fileSize: '2.4 MB' }, fileName });
    addToast({ type: 'info', title: 'Upload started', message: fileName });

    setTimeout(() => {
      pushJobEvent(jobId, { type: 'parsed', meta: { rowsParsed: 520 } });
      addToast({ type: 'success', title: 'Parsed', message: 'Rows: 520' });
    }, 800);

    setTimeout(() => {
      pushJobEvent(jobId, { type: 'buffered', meta: { rowsBuffered: 520 } });
    }, 1600);

    setTimeout(() => {
      pushJobEvent(jobId, { type: 'validated', meta: { errors: 12, warnings: 3 } });
      addToast({ type: 'warning', title: 'Validation finished', message: '12 errors → Review', actionLabel: 'Open', onAction: () => setOpen(true) });
    }, 2400);
  }

  function simulateReady() {
    pushJobEvent(jobId, { type: 'revalidated', meta: { errors: 0 } });
    pushJobEvent(jobId, { type: 'ready' });
    addToast({ type: 'success', title: 'All good', message: 'Ready to Post to GL', actionLabel: 'Open', onAction: () => setOpen(true) });
  }

  function simulateAborted() {
    pushJobEvent(jobId, { type: 'aborted', meta: { reason: 'Corrupted file' } });
    addToast({ type: 'error', title: 'Aborted', message: 'Processing was aborted (Corrupted file).' });
  }

  function simulateFailed() {
    pushJobEvent(jobId, { type: 'failed', meta: { message: 'Connection timeout' } });
    addToast({ type: 'error', title: 'Failed', message: 'Connection timeout' });
  }

  function simulateErrors(n) {
    pushJobEvent(jobId, { type: 'validated', meta: { errors: n, warnings: 0 } });
    const label = n <= 5 ? 'Review now' : n <= 50 ? 'Fix in Grid' : 'Download workbook';
    addToast({ type: 'warning', title: `Validation finished`, message: `${n} error(s)`, actionLabel: label, onAction: () => setOpen(true) });
  }

  // Basic smoke test to ensure provider & APIs work without runtime errors
  function runSmoke() {
    try {
      const tid = addToast({ type: 'success', title: 'Smoke', message: 'ok' });
      console.assert(typeof tid === 'string', 'Toast id should be string');
      upsertJob('TEST-1', { fileName: 'test.csv' });
      pushJobEvent('TEST-1', { type: 'uploaded', meta: { fileSize: '1 KB' } });
      pushJobEvent('TEST-1', { type: 'validated', meta: { errors: 0 } });
      console.log('Smoke tests passed');
    } catch (e) {
      console.error('Smoke tests failed', e);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notification System Demo</h2>
          <p className="text-sm text-gray-600">Toasts + Notification Center with per-upload timelines</p>
        </div>
        <NotificationBell />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={simulateFlow} className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm">Simulate Upload → Validate</button>
        <button onClick={simulateReady} className="px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 text-sm">Simulate Ready to Post</button>
        <button onClick={simulateAborted} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Simulate Aborted</button>
        <button onClick={simulateFailed} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Simulate Failed</button>
        <button onClick={() => simulateErrors(3)} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Errors: 3 (Review)</button>
        <button onClick={() => simulateErrors(20)} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Errors: 20 (Grid)</button>
        <button onClick={() => simulateErrors(75)} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Errors: 75 (Workbook)</button>
        <button onClick={() => setOpen(true)} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Open Center</button>
        <button onClick={runSmoke} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Run Smoke Tests</button>
      </div>

      <div className="mt-6 p-4 bg-white rounded-2xl ring-1 ring-gray-100 text-sm text-gray-700 space-y-2">
        <b>How to use in your app</b>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Wrap your layout with <code>{`<NotificationsProvider>`}</code>.</li>
          <li>Put <code>{`<NotificationBell />`}</code> in the navbar.</li>
          <li>When backend events arrive (SSE/WebSocket/poll), call:</li>
        </ol>
        <pre className="text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto"><code>{`pushJobEvent(jobId, { type, meta })`}</code></pre>
        <ol className="list-decimal list-inside mt-2 space-y-1" start={4}>
          <li>To alert users with a toast, call:</li>
        </ol>
        <pre className="text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto"><code>{`addToast({ type, title, message, actionLabel, onAction })`}</code></pre>
      </div>
    </div>
  );
}
