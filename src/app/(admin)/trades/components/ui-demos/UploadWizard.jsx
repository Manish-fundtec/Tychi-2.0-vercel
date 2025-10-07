import React, { useMemo } from "react";

/**
 * Minimal, framework-agnostic React component (TailwindCSS styles)
 * that shows a horizontal wizard with:
 *  - Progress bar
 *  - Step "chips" with icons (✔ / … / ! / ○)
 *  - Per-step counts under each chip (e.g., Rows parsed: 500, Errors: 12)
 *
 * HOW TO USE
 * <UploadWizard
 *   steps=[
 *     { key: 'choose',    label: 'Choose File',     status: 'success' },
 *     { key: 'upload',    label: 'Upload to S3',    status: 'success', meta: { size: '2.4 MB' } },
 *     { key: 'buffer',    label: 'Parse & Buffer',  status: 'success', meta: { rowsParsed: 500 } },
 *     { key: 'validate',  label: 'Validate',        status: 'running', meta: { errors: 12, warnings: 3 } },
 *   ]
 * />
 *
 * STATUS RULES
 * - success  → ✔ (green)
 * - running  → … (blue)
 * - error    → ! (red)
 * - pending  → ○ (neutral)
 *
 * PROGRESS
 * - Overall percent = (completed steps / total) * 100
 * - You can also pass step.progress (0–100) if you want partial progress within a step.
 */

const STATUS_ICON = {
  success: "✔",
  running: "…",
  error: "!",
  pending: "○",
};

const STATUS_CLASSES = {
  success: "bg-green-100 text-green-700 ring-1 ring-green-200",
  running: "bg-blue-100 text-blue-700 ring-1 ring-blue-200 animate-pulse",
  error: "bg-red-100 text-red-700 ring-1 ring-red-200",
  pending: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
};

// Utility: format the per-step meta into user-friendly lines
function metaLines(meta) {
  if (!meta) return [];
//   const out: string[] = [];
  if (meta.rowsParsed != null) out.push(`Rows parsed: ${meta.rowsParsed}`);
  if (meta.rowsBuffered != null) out.push(`Rows buffered: ${meta.rowsBuffered}`);
  if (meta.errors != null) out.push(`Errors: ${meta.errors}`);
  if (meta.warnings != null) out.push(`Warnings: ${meta.warnings}`);
  if (meta.size) out.push(`Size: ${meta.size}`);
  if (meta.elapsed) out.push(`Time: ${meta.elapsed}`);
  return out;
}

export default function UploadWizard({ steps = [] }) {
  const total = Array.isArray(steps) ? steps.length : 0;

  // Compute overall progress by counting successes + (running partial)
  const overall = useMemo(() => {
    if (!Array.isArray(steps) || total === 0) return 0;
    const completed = steps.filter(s => s.status === 'success').length;
    const running = steps.find(s => s.status === 'running');
    const runningPct = running?.progress != null ? running.progress/100 : (running ? 0.33 : 0); // default partial if running
    const pct = Math.min(100, Math.round(((completed + runningPct) / total) * 100));
    return pct;
  }, [steps, total]);

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Trades Upload – Processing</h2>
        <p className="text-sm text-gray-600">Tracks your file through: Choose → Upload → Buffer → Validate</p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden ring-1 ring-gray-200">
        <div
          className="h-3 bg-blue-500 transition-all"
          style={{ width: `${overall}%` }}
          aria-label={`Overall progress ${overall}%`}
        />
      </div>
      <div className="text-right text-xs text-gray-500 -mt-4 mb-4">{overall}%</div>

      {/* Step chips */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.key} className="flex flex-col gap-2 p-4 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-base font-semibold ${STATUS_CLASSES[s.status]}`}>
                {STATUS_ICON[s.status]}
              </span>
              <div className="font-medium">{s.label}</div>
            </div>

            {/* Optional tiny progress for the running step */}
            {s.status === 'running' && (
              <div className="w-full bg-gray-100 rounded-full h-2 mt-1 overflow-hidden">
                <div className="h-2 bg-blue-500 transition-all" style={{ width: `${Math.max(5, Math.min(100, s.progress ?? 25))}%` }} />
              </div>
            )}

            {/* Meta lines */}
            {metaLines(s.meta).length > 0 && (
              <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                {metaLines(s.meta).map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            )}

            {/* Suggest next action */}
            {s.status === 'error' && (
              <div className="text-xs text-red-600 mt-1">Action needed. Open details to fix.</div>
            )}
          </div>
        ))}
      </div>

      {/* Footer actions (example) */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Review Errors</button>
        <button className="px-4 py-2 rounded-xl bg-gray-100 text-gray-900 hover:bg-gray-200">Fix in Grid</button>
        <button className="px-4 py-2 rounded-xl bg-gray-100 text-gray-900 hover:bg-gray-200">Download Error Workbook</button>
        <button className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700">Abort</button>
      </div>

      {/* Helper: small legend */}
      <div className="mt-4 text-xs text-gray-500">
        <span className="mr-3">✔ = done</span>
        <span className="mr-3">… = in progress</span>
        <span className="mr-3">! = error</span>
        <span>○ = waiting</span>
      </div>
    </div>
  );
}

// QUICK DEMO PREVIEW – you can delete below in your project
export function DemoContainer() {
  const steps = [
    { key: 'choose',   label: 'Choose File',    status: 'success' },
    { key: 'upload',   label: 'Upload to S3',   status: 'success', meta: { size: '2.4 MB' } },
    { key: 'buffer',   label: 'Parse & Buffer', status: 'success', meta: { rowsParsed: 500, rowsBuffered: 500 } },
    { key: 'validate', label: 'Validate',       status: 'running', meta: { errors: 12, warnings: 3 }, progress: 40 },
  ];
  return <UploadWizard steps={steps} />;
}
