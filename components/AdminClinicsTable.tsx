"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Loader2, RefreshCw, Search, Sparkles, Star } from "lucide-react";
import { Badge, EmptyState, Table, Td, Th, statusTone } from "@/components/app/ui";

type ClinicRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  latestScore: number | null;
  siteStatus: string | null;
  siteUrl: string | null;
  customDomain: string | null;
  subscriptionStatus: string | null;
  ownerEmail: string | null;
  createdAt: string;
};

type Action = "rescan" | "regenerate" | "reviews";
const ACTIONS: Record<Action, { label: string; icon: typeof RefreshCw; url: (id: string) => string; title: string }> = {
  rescan: { label: "Rescan", icon: RefreshCw, url: (id) => `/api/clinics/${id}/score`, title: "Refresh Google data and recompute the score" },
  regenerate: { label: "Regenerate", icon: Sparkles, url: (id) => `/api/admin/clinics/${id}/regenerate`, title: "Rewrite the website copy with AI" },
  reviews: { label: "Sync reviews", icon: Star, url: (id) => `/api/admin/clinics/${id}/reviews-sync`, title: "Pull the latest Google reviews" },
};

type Result = { ok: boolean; message: string };

export default function AdminClinicsTable() {
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, Action | undefined>>({});
  const [results, setResults] = useState<Record<string, Result | undefined>>({});
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/clinics", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed to load (${res.status})`);
      setClinics(data.clinics ?? []);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load clinics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(id: string, action: Action) {
    setBusy((b) => ({ ...b, [id]: action }));
    setResults((r) => ({ ...r, [id]: undefined }));
    try {
      const res = await fetch(ACTIONS[action].url(id), { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setResults((r) => ({ ...r, [id]: { ok: true, message: data.message ?? `${ACTIONS[action].label} done` } }));
      await load();
    } catch (err) {
      setResults((r) => ({ ...r, [id]: { ok: false, message: err instanceof Error ? err.message : "Something went wrong" } }));
    } finally {
      setBusy((b) => ({ ...b, [id]: undefined }));
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clinics;
    return clinics.filter((c) => [c.name, c.ownerEmail, c.slug, c.customDomain].some((v) => v?.toLowerCase().includes(q)));
  }, [clinics, query]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading clinics…
      </div>
    );
  }
  if (loadError) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{loadError}</p>;
  if (clinics.length === 0) return <EmptyState title="No clinics yet" description="Clinics appear here once someone runs an audit." />;

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clinic, owner or domain"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/20"
        />
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Clinic</Th>
            <Th>Status</Th>
            <Th>Score</Th>
            <Th>Site</Th>
            <Th>Plan</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => {
            const running = busy[c.id];
            const result = results[c.id];
            return (
              <tr key={c.id} className="align-top hover:bg-slate-50/60">
                <Td>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.ownerEmail ?? "No owner yet"}</p>
                  <div className="mt-1 flex gap-3 text-xs">
                    <a href={`/clinic/${c.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-mint-500 hover:underline">
                      <FileText className="h-3 w-3" /> Report
                    </a>
                    {c.siteUrl && (
                      <a href={c.siteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-mint-500 hover:underline">
                        <ExternalLink className="h-3 w-3" /> Site
                      </a>
                    )}
                  </div>
                </Td>
                <Td>
                  <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                </Td>
                <Td className="font-semibold text-slate-900">{c.latestScore ?? "—"}</Td>
                <Td>{c.siteStatus ? <Badge tone={statusTone(c.siteStatus)}>{c.siteStatus}</Badge> : <span className="text-slate-400">—</span>}</Td>
                <Td>
                  {c.subscriptionStatus ? <Badge tone={statusTone(c.subscriptionStatus)}>{c.subscriptionStatus.replace("_", " ")}</Badge> : <span className="text-slate-400">—</span>}
                </Td>
                <Td className="text-right">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {(Object.keys(ACTIONS) as Action[]).map((action) => {
                      const a = ACTIONS[action];
                      const isRunning = running === action;
                      return (
                        <button
                          key={action}
                          onClick={() => run(c.id, action)}
                          disabled={!!running}
                          title={a.title}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <a.icon className="h-3.5 w-3.5" />}
                          {isRunning ? "Working…" : a.label}
                        </button>
                      );
                    })}
                  </div>
                  {result && (
                    <p className={`mt-2 text-xs ${result.ok ? "text-emerald-700" : "text-red-600"}`} role="status">
                      {result.message}
                    </p>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {filtered.length === 0 && <p className="text-sm text-slate-500">No clinics match “{query}”.</p>}
    </div>
  );
}
