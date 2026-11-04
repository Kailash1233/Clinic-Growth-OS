import { AlertCircle, CheckCircle2, CircleDashed, Download, Lightbulb, XCircle } from "lucide-react";
import type { CheckStatus, GrowthReport } from "@/lib/report";

const STATUS: Record<CheckStatus, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  pass: { icon: CheckCircle2, cls: "text-emerald-600", label: "Pass" },
  partial: { icon: AlertCircle, cls: "text-amber-600", label: "Partial" },
  fail: { icon: XCircle, cls: "text-red-600", label: "Fix" },
  unknown: { icon: CircleDashed, cls: "text-slate-400", label: "Not measured" },
};

function color(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function DownloadReportButton({ clinicId, className = "" }: { clinicId: string; className?: string }) {
  return (
    <a
      href={`/api/clinics/${clinicId}/report`}
      className={`inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-sm transition hover:bg-ink-100/40 ${className}`}
    >
      <Download className="h-4 w-4" />
      Download full report (PDF)
    </a>
  );
}

/** Every check behind the score, factor by factor, with what to do about each gap. */
export default function DetailedReport({ report }: { report: GrowthReport }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink-100 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mint-500">Overall: {report.band.label}</p>
            <p className="mt-1 text-sm text-ink-500">{report.band.description}</p>
          </div>
          <DownloadReportButton clinicId={report.clinic.id} />
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-ink-100">
          <table className="w-full text-sm">
            <thead className="bg-ink-100/40 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2.5">Factor</th>
                <th className="px-4 py-2.5">Score</th>
                <th className="hidden px-4 py-2.5 sm:table-cell">Weight</th>
                <th className="px-4 py-2.5 text-right">Adds</th>
              </tr>
            </thead>
            <tbody>
              {report.factors.map((f) => (
                <tr key={f.key} className="border-t border-ink-100">
                  <td className="px-4 py-3 font-medium text-ink-900">{f.label}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 font-semibold">{f.score}</span>
                      <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-ink-100 sm:block">
                        <span className={`block h-1.5 ${color(f.score)}`} style={{ width: `${f.score}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 sm:table-cell">{Math.round(f.weight * 100)}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink-900">{f.contribution} pts</td>
                </tr>
              ))}
              <tr className="border-t border-ink-100 bg-ink-100/20">
                <td className="px-4 py-3 font-bold text-ink-900" colSpan={3}>
                  Growth Score
                </td>
                <td className="px-4 py-3 text-right font-bold text-ink-900">{report.overall}/100</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {report.topActions.length > 0 && (
        <div className="rounded-2xl border border-mint-100 bg-mint-50 p-6">
          <h3 className="flex items-center gap-2 text-base font-bold text-ink-900">
            <Lightbulb className="h-5 w-5 text-mint-500" /> Your top actions
          </h3>
          <p className="mt-1 text-sm text-ink-500">Ordered by how many points each one can add.</p>
          <ol className="mt-4 space-y-2">
            {report.topActions.map((a, i) => (
              <li key={a} className="flex gap-3 text-sm text-ink-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint-500 text-xs font-bold text-white">{i + 1}</span>
                <span className="pt-0.5">{a}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {report.factors.map((f) => (
        <section key={f.key} className="rounded-2xl border border-ink-100 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-ink-900">{f.label}</h3>
              <p className="mt-1 text-sm text-ink-500">{f.summary}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-ink-900">{f.score}</p>
              <p className="text-xs text-ink-400">of 100 · {Math.round(f.weight * 100)}% weight</p>
            </div>
          </div>
          <ul className="mt-5 divide-y divide-ink-100 rounded-xl border border-ink-100">
            {f.checks.map((c) => {
              const s = STATUS[c.status];
              return (
                <li key={c.label} className="flex items-start gap-3 px-4 py-3">
                  <s.icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.cls}`} aria-label={s.label} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">{c.label}</p>
                    <p className="text-sm text-ink-500">{c.detail}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${s.cls}`}>{s.label}</span>
                </li>
              );
            })}
          </ul>
          {f.recommendations.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">What to do</p>
              <ul className="mt-2 space-y-1.5">
                {f.recommendations.map((r) => (
                  <li key={r} className="flex gap-2 text-sm text-ink-700">
                    <span className="text-mint-500">→</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}

      <details className="rounded-2xl border border-ink-100 bg-white p-6">
        <summary className="cursor-pointer text-sm font-semibold text-ink-900">How this score is calculated</summary>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-500">
          {report.methodology.map((m) => (
            <li key={m}>• {m}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-400">
          Last scanned {report.computedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
      </details>
    </div>
  );
}
