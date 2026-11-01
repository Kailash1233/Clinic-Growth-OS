"use client";

import { useState } from "react";

type GscMethod = "meta" | "dns_txt" | null;

export default function SiteSettingsForm(props: {
  gaMeasurementId: string | null;
  gscVerificationMethod: GscMethod;
  gscVerificationValue: string | null;
  customHeaderScripts: string | null;
  customBodyScripts: string | null;
}) {
  const [gaMeasurementId, setGaMeasurementId] = useState(props.gaMeasurementId ?? "");
  const [gscVerificationMethod, setGscVerificationMethod] = useState<GscMethod>(props.gscVerificationMethod);
  const [gscVerificationValue, setGscVerificationValue] = useState(props.gscVerificationValue ?? "");
  const [customHeaderScripts, setCustomHeaderScripts] = useState(props.customHeaderScripts ?? "");
  const [customBodyScripts, setCustomBodyScripts] = useState(props.customBodyScripts ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gaMeasurementId: gaMeasurementId || null,
          gscVerificationMethod: gscVerificationMethod || null,
          gscVerificationValue: gscVerificationValue || null,
          customHeaderScripts: customHeaderScripts || null,
          customBodyScripts: customBodyScripts || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      setSaved(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700">GA4 measurement ID</label>
        <input
          value={gaMeasurementId}
          onChange={(e) => setGaMeasurementId(e.target.value)}
          placeholder="G-XXXXXXXXXX"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Search Console verification</label>
        <select
          value={gscVerificationMethod ?? ""}
          onChange={(e) => setGscVerificationMethod((e.target.value || null) as GscMethod)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="">Not set up</option>
          <option value="meta">Meta tag</option>
          <option value="dns_txt">DNS TXT record (recommended on custom domains)</option>
        </select>
        {gscVerificationMethod && (
          <input
            value={gscVerificationValue}
            onChange={(e) => setGscVerificationValue(e.target.value)}
            placeholder="Verification value from Search Console"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Custom header JavaScript</label>
        <p className="text-xs text-slate-400">Paste JS code only — no surrounding &lt;script&gt; tags.</p>
        <textarea
          value={customHeaderScripts}
          onChange={(e) => setCustomHeaderScripts(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Custom body JavaScript</label>
        <p className="text-xs text-slate-400">Paste JS code only — no surrounding &lt;script&gt; tags.</p>
        <textarea
          value={customBodyScripts}
          onChange={(e) => setCustomBodyScripts(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
