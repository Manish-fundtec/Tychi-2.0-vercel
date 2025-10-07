import Link from "next/link";

export default function Page() {
  const Item = ({ href, label }) => (
    <Link href={href} className="block p-3 rounded-xl bg-white ring-1 ring-gray-100 hover:bg-gray-50">
      {label}
    </Link>
  );
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-2">
      <h1 className="text-xl font-semibold mb-2">UI Demos</h1>
      <Item href="/trades/ui-demos/upload-wizard" label="Upload Wizard" />
      <Item href="/trades/ui-demos/uploads-dashboard" label="Uploads Dashboard" />
      <Item href="/trades/ui-demos/thresholds" label="Error Handling Thresholds" />
      <Item href="/trades/ui-demos/notifications" label="Notification System" />
      <Item href="/trades/ui-demos/abort-flow" label="Abort Flow (Soft vs Hard)" />
      <Item href="/trades/ui-demos/guardrails" label="Guardrails & Comfort Features" />
    </main>
  );
}
