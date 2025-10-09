"use client";
import React, { useMemo, useState } from "react";

/**
 * Self‑contained demo of an "Uploads Dashboard" page showing each upload
 * as a card or table row, with status chips, counts, progress, and actions.
 *
 * Tech: React + TailwindCSS (no external libs). Replace demo data with your API.
 *
 * HOW TO WIRE:
 * - Replace `demoJobs` with data from GET /api/trades/jobs
 * - Each job can include: id, fileName, uploader, uploadedAt, status,
 *   counts { rows, errors, warnings }, progress (0-100), and actions enabled flags.
 */

const demoJobs = [
  {
    id: "J-24001",
    fileName: "trades_2025-08-10.xlsx",
    uploader: "athar@fundtec.co",
    uploadedAt: "2025-08-10 14:22",
    status: "Validating", // Uploaded | Parsing | Buffered | Validating | Needs Fix | Ready | Aborted | Failed
    counts: { rows: 520, errors: 12, warnings: 3 },
    progress: 68,
  },
  {
    id: "J-23999",
    fileName: "clientA_trades.csv",
    uploader: "ashwin@fundtec.co",
    uploadedAt: "2025-08-10 10:03",
    status: "Needs Fix",
    counts: { rows: 310, errors: 7, warnings: 0 },
    progress: 100,
  },
  {
    id: "J-23997",
    fileName: "bulk_upload_july.csv",
    uploader: "ops@fundtec.co",
    uploadedAt: "2025-08-09 18:40",
    status: "Ready",
    counts: { rows: 1200, errors: 0, warnings: 5 },
    progress: 100,
  },
  {
    id: "J-23996",
    fileName: "broken_file.xlsx",
    uploader: "ops@fundtec.co",
    uploadedAt: "2025-08-09 17:05",
    status: "Aborted",
    counts: { rows: 0, errors: 0, warnings: 0 },
    progress: 0,
  },
  {
    id: "J-23994",
    fileName: "nightly_feed.csv",
    uploader: "system",
    uploadedAt: "2025-08-08 23:59",
    status: "Failed",
    counts: { rows: 800, errors: 120, warnings: 0 },
    progress: 20,
  },
];

const STATUS_COLORS = {
  Uploaded: "bg-gray-100 text-gray-700 ring-gray-200",
  Parsing: "bg-blue-100 text-blue-700 ring-blue-200",
  Buffered: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  Validating: "bg-blue-100 text-blue-700 ring-blue-200",
  "Needs Fix": "bg-amber-100 text-amber-700 ring-amber-200",
  Ready: "bg-green-100 text-green-700 ring-green-200",
  Aborted: "bg-gray-100 text-gray-700 ring-gray-200",
  Failed: "bg-red-100 text-red-700 ring-red-200",
};

function StatusChip({ status }) {
  return (
    <span className={`px-2 py-1 text-xs rounded-full ring-1 ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700 ring-gray-200"}`}>
      {status}
    </span>
  );
}

function ProgressBar({ value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 ring-1 ring-gray-200 overflow-hidden">
      <div className="h-2 bg-blue-500 transition-all" style={{ width: `${v}%` }} />
    </div>
  );
}

function JobCard({ job, onAction }) {
  const { id, fileName, uploader, uploadedAt, status, counts, progress } = job;
  const hasErrors = (counts?.errors || 0) > 0;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">{id}</div>
          <div className="font-medium">{fileName}</div>
          <div className="text-xs text-gray-500">Uploaded by {uploader} • {uploadedAt}</div>
        </div>
        <StatusChip status={status} />
      </div>

      <ProgressBar value={progress} />

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>Rows: <span className="font-medium">{counts?.rows ?? 0}</span></div>
        <div>Errors: <span className={`font-medium ${hasErrors ? "text-red-600" : ""}`}>{counts?.errors ?? 0}</span></div>
        <div>Warnings: <span className="font-medium">{counts?.warnings ?? 0}</span></div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {status === "Needs Fix" && (
          <button onClick={() => onAction(id, "review")} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm">Review Errors</button>
        )}
        {status === "Needs Fix" && (
          <button onClick={() => onAction(id, "grid")} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Fix in Grid</button>
        )}
        {hasErrors && (
          <button onClick={() => onAction(id, "download")} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Download Error Workbook</button>
        )}
        {(status === "Validating" || status === "Needs Fix") && (
          <button onClick={() => onAction(id, "revalidate")} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Revalidate</button>
        )}
        {(status === "Validating" || status === "Needs Fix") && (
          <button onClick={() => onAction(id, "abort")} className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm">Abort</button>
        )}
        {status === "Ready" && (
          <button onClick={() => onAction(id, "post")} className="px-3 py-1.5 rounded-xl bg-green-600 text-white hover:bg-green-700 text-sm">Post to GL</button>
        )}
      </div>
    </div>
  );
}

function JobRow({ job, onAction }) {
  const { id, fileName, uploader, uploadedAt, status, counts, progress } = job;
  const hasErrors = (counts?.errors || 0) > 0;
  return (
    <tr className="border-b">
      <td className="px-3 py-2 text-sm text-gray-500">{id}</td>
      <td className="px-3 py-2 text-sm font-medium">{fileName}</td>
      <td className="px-3 py-2 text-sm text-gray-600">{uploader}</td>
      <td className="px-3 py-2 text-sm text-gray-600">{uploadedAt}</td>
      <td className="px-3 py-2"><StatusChip status={status} /></td>
      <td className="px-3 py-2 w-48"><ProgressBar value={progress} /></td>
      <td className="px-3 py-2 text-sm">{counts?.rows ?? 0}</td>
      <td className={`px-3 py-2 text-sm ${hasErrors ? "text-red-600" : ""}`}>{counts?.errors ?? 0}</td>
      <td className="px-3 py-2 text-sm">{counts?.warnings ?? 0}</td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {status === "Needs Fix" && (
            <button onClick={() => onAction(id, "review")} className="px-2 py-1 rounded-md bg-blue-600 text-white text-xs">Review</button>
          )}
          {status === "Needs Fix" && (
            <button onClick={() => onAction(id, "grid")} className="px-2 py-1 rounded-md bg-gray-100 text-xs">Grid</button>
          )}
          {hasErrors && (
            <button onClick={() => onAction(id, "download")} className="px-2 py-1 rounded-md bg-gray-100 text-xs">Workbook</button>
          )}
          {(status === "Validating" || status === "Needs Fix") && (
            <button onClick={() => onAction(id, "revalidate")} className="px-2 py-1 rounded-md bg-gray-100 text-xs">Revalidate</button>
          )}
          {(status === "Validating" || status === "Needs Fix") && (
            <button onClick={() => onAction(id, "abort")} className="px-2 py-1 rounded-md bg-red-600 text-white text-xs">Abort</button>
          )}
          {status === "Ready" && (
            <button onClick={() => onAction(id, "post")} className="px-2 py-1 rounded-md bg-green-600 text-white text-xs">Post</button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function UploadsDashboard() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [view, setView] = useState("cards"); // 'cards' | 'table'
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const jobs = demoJobs; // replace with API result

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchQ = !query || j.fileName.toLowerCase().includes(query.toLowerCase()) || j.id.toLowerCase().includes(query.toLowerCase());
      const matchS = status === "All" || j.status === status;
      return matchQ && matchS;
    });
  }, [jobs, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  function onAction(id, action) {
    // Replace with real actions: navigate, download, POST, etc.
    // e.g., fetch(`/api/trades/jobs/${id}/revalidate`, { method: 'POST' })
    alert(`${action} → ${id}`);
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Trades Uploads</h2>
          <p className="text-sm text-gray-600">Track all uploaded files and their validation status.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm">Download Template</button>
          <button className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm">Upload New Trades</button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => { setPage(1); setQuery(e.target.value); }}
          placeholder="Search by Job ID or file name"
          className="px-3 py-2 rounded-xl border w-64 text-sm"
        />
        <select
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          className="px-3 py-2 rounded-xl border text-sm"
        >
          {['All','Uploaded','Parsing','Buffered','Validating','Needs Fix','Ready','Aborted','Failed'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="ml-auto flex gap-1 text-sm">
          <button onClick={() => setView('cards')} className={`px-3 py-2 rounded-xl ${view==='cards' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Cards</button>
          <button onClick={() => setView('table')} className={`px-3 py-2 rounded-xl ${view==='table' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Table</button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl ring-1 ring-gray-100 text-gray-600">
          No uploads found. Try changing filters or <button className="underline">upload a new file</button>.
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pageData.map(job => (
            <JobCard key={job.id} job={job} onAction={onAction} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl ring-1 ring-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Job ID</th>
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2">Uploader</th>
                <th className="px-3 py-2">Uploaded</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Rows</th>
                <th className="px-3 py-2">Errors</th>
                <th className="px-3 py-2">Warnings</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {pageData.map(job => (
                <JobRow key={job.id} job={job} onAction={onAction} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div>Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p-1))}
            disabled={page === 1}
          >Prev</button>
          <button
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p+1))}
            disabled={page === totalPages}
          >Next</button>
        </div>
      </div>
    </div>
  );
}
