"use client";
import React, { useEffect, useRef, useState } from "react";

/**
 * Abort Flow – Soft vs Hard (React + Tailwind)
 *
 * What this demo shows:
 * - An Abort button that opens a confirmation modal
 * - Two modes: Soft Abort (keep buffer rows) and Hard Abort (delete buffer rows)
 * - Reason input (required)
 * - Extra confirmation checkbox for Hard Abort
 * - Disabled state while processing
 * - Job timeline gets a new entry with who/when/reason/mode
 *
 * How to use:
 * - Drop <AbortFlowDemo /> into a Next.js page with Tailwind enabled.
 * - Replace the mock API (abortJob) with your real endpoint.
 */

/******************** Utils ********************/
function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function nowISO() {
  return new Date().toISOString();
}

/******************** Modal ********************/
function AbortModal({ open, onClose, onConfirm, job, currentUser }) {
  const [mode, setMode] = useState("soft"); // 'soft' | 'hard'
  const [reason, setReason] = useState("");
  const [ack, setAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const reasonRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMode("soft");
      setReason("");
      setAck(false);
      setSubmitting(false);
      setTimeout(() => reasonRef.current?.focus(), 50);
    }
  }, [open]);

  async function handleConfirm() {
    if (!reason.trim()) return;
    if (mode === "hard" && !ack) return;
    setSubmitting(true);
    try {
      await onConfirm?.({ mode, reason, user: currentUser, ts: nowISO() });
      onClose?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={classNames("fixed inset-0 z-50", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      {/* Backdrop */}
      <div className={classNames("absolute inset-0 bg-black/40 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => !submitting && onClose?.()} />

      {/* Panel */}
      <div className={classNames("absolute left-1/2 top-16 -translate-x-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl ring-1 ring-gray-200 transition-transform", open ? "scale-100" : "scale-95")}
           role="dialog" aria-modal="true" aria-labelledby="abort-title">
        <div className="p-5 border-b">
          <h3 id="abort-title" className="text-lg font-semibold">Abort processing for {job?.fileName || job?.jobId}</h3>
          <p className="text-xs text-gray-600">Choose abort type. Hard abort permanently deletes buffer rows and cannot be resumed.</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setMode("soft")}
                    className={classNames("p-3 rounded-xl ring-1 text-left", mode === "soft" ? "ring-blue-400 bg-blue-50" : "ring-gray-200 bg-white")}
                    aria-pressed={mode === "soft"}>
              <div className="font-medium">Soft Abort</div>
              <div className="text-xs text-gray-600">Stop processing; <b>keep buffer rows</b> for review (resumable).</div>
            </button>
            <button type="button" onClick={() => setMode("hard")}
                    className={classNames("p-3 rounded-xl ring-1 text-left", mode === "hard" ? "ring-red-400 bg-red-50" : "ring-gray-200 bg-white")}
                    aria-pressed={mode === "hard"}>
              <div className="font-medium">Hard Abort</div>
              <div className="text-xs text-gray-600">Stop and <b>delete buffer rows</b>. Not resumable.</div>
            </button>
          </div>

          {/* Reason */}
          <label className="block text-sm">
            <span className="text-gray-700">Reason <span className="text-red-600">*</span></span>
            <textarea ref={reasonRef} value={reason} onChange={(e) => setReason(e.target.value)}
                      rows={3} className="mt-1 w-full px-3 py-2 border rounded-xl text-sm"
                      placeholder="e.g., Corrupted file, wrong template, duplicate feed" />
            {!reason.trim() && <div className="text-[11px] text-red-600 mt-1">Reason is required.</div>}
          </label>

          {/* Extra confirmation for hard abort */}
          {mode === "hard" && (
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" className="mt-0.5" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              <span>I understand this will permanently delete buffer rows and cannot be undone.</span>
            </label>
          )}

          {/* Consequences box */}
          <div className={classNames("p-3 rounded-xl text-xs", mode === "hard" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800")}> 
            {mode === "hard" ? (
              <ul className="list-disc list-inside space-y-0.5">
                <li>Processing stops immediately.</li>
                <li>All buffer rows are deleted.</li>
                <li>Job moves to <b>Aborted (cleaned)</b> and cannot be resumed.</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-0.5">
                <li>Processing stops immediately.</li>
                <li>Buffer rows are <b>kept</b> for forensics and can be resumed later.</li>
                <li>Job moves to <b>Aborted</b> (resumable).</li>
              </ul>
            )}
          </div>
        </div>

        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={() => onClose?.()} disabled={submitting} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Cancel</button>
          <button onClick={handleConfirm} disabled={submitting || !reason.trim() || (mode === 'hard' && !ack)}
                  className={classNames("px-4 py-2 rounded-xl text-white",
                    submitting ? "bg-gray-400" : mode === "hard" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")}> 
            {submitting ? "Aborting..." : mode === "hard" ? "Confirm Hard Abort" : "Confirm Soft Abort"}
          </button>
        </div>
      </div>
    </div>
  );
}

/******************** Mock API ********************/
async function abortJob({ jobId, mode, reason, user }) {
  // Replace this with a POST to your backend
  await new Promise(r => setTimeout(r, 700));
  if (!reason) throw new Error("Reason required");
  return { ok: true, jobId, mode, reason, user, ts: nowISO() };
}

/******************** Demo Container ********************/
export default function AbortFlowDemo() {
  const [job, setJob] = useState({ jobId: "J-24001", fileName: "trades_2025-08-10.xlsx", status: "Validating" });
  const [events, setEvents] = useState([
    { ts: nowISO(), type: "uploaded", meta: { fileSize: "2.4 MB" } },
    { ts: nowISO(), type: "parsed", meta: { rowsParsed: 520 } },
    { ts: nowISO(), type: "buffered", meta: { rowsBuffered: 520 } },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const currentUser = { id: "U-12", name: "ops@fundtec.co" };

  async function confirmAbort({ mode, reason, user, ts }) {
    const res = await abortJob({ jobId: job.jobId, mode, reason, user });
    if (res.ok) {
      // Update status + timeline
      setJob(j => ({ ...j, status: mode === "hard" ? "Aborted (cleaned)" : "Aborted" }));
      setEvents(evts => ([...evts, { ts, type: "aborted", meta: { mode, reason, user: user.name } }]));
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{job.jobId}</div>
          <h2 className="text-xl font-semibold">{job.fileName}</h2>
          <div className="text-xs text-gray-600">Status: <b>{job.status}</b></div>
        </div>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700">Abort</button>
      </header>

      {/* Timeline */}
      <section className="bg-white rounded-2xl ring-1 ring-gray-100 p-4">
        <div className="text-sm font-medium mb-2">Job timeline</div>
        <div className="relative pl-5">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-2">
            {events.map((e, i) => (
              <TimelineEvent key={i} e={e} />
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      <AbortModal open={modalOpen} onClose={() => setModalOpen(false)} onConfirm={confirmAbort} job={job} currentUser={currentUser} />

      {/* Test buttons */}
      <section className="bg-white rounded-2xl ring-1 ring-gray-100 p-4 text-sm">
        <div className="font-medium mb-2">Quick Tests</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setModalOpen(true)} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200">Open Modal</button>
          <button onClick={async () => { await confirmAbort({ mode: "soft", reason: "Test soft", user: currentUser, ts: nowISO() }); }} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200">Run Soft Abort</button>
          <button onClick={async () => { await confirmAbort({ mode: "hard", reason: "Test hard", user: currentUser, ts: nowISO() }); }} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200">Run Hard Abort</button>
        </div>
        <ul className="mt-3 text-xs text-gray-600 list-disc list-inside">
          <li>Soft abort keeps buffer rows; status becomes <b>Aborted</b>.</li>
          <li>Hard abort deletes buffer rows; status becomes <b>Aborted (cleaned)</b>.</li>
          <li>Each abort appends a timeline entry with <i>mode</i>, <i>reason</i>, <i>user</i>, and timestamp.</li>
        </ul>
      </section>
    </div>
  );
}

function TimelineEvent({ e }) {
  const clr = e.type === "aborted" ? (e.meta?.mode === "hard" ? "bg-red-500" : "bg-amber-500") : "bg-blue-500";
  const label = e.type === "aborted"
    ? `Aborted (${e.meta?.mode}) — ${e.meta?.reason}`
    : e.type === "uploaded" ? `Uploaded (${e.meta?.fileSize})`
    : e.type === "parsed" ? `Parsed: ${e.meta?.rowsParsed} rows`
    : e.type === "buffered" ? `Buffered: ${e.meta?.rowsBuffered} rows`
    : String(e.type);
  const when = new Date(e.ts).toLocaleString();
  return (
    <div className="relative pl-6">
      <span className={classNames("absolute left-0 top-1 w-3 h-3 rounded-full ring-2 ring-white", clr)} />
      <div className="text-sm">{label}</div>
      <div className="text-[11px] text-gray-500">{when} {e.meta?.user ? `• by ${e.meta.user}` : ""}</div>
    </div>
  );
}
