const LABELS: Record<string, string> = {
  visibility: "Visibility",
  siteHealth: "Site health",
  reviews: "Reviews",
  conversionReadiness: "Conversion readiness",
};

function barColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export default function ScoreBreakdown({
  overall,
  subScores,
}: {
  overall: number;
  subScores: Record<string, number>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-bold text-slate-900">{overall}</span>
        <span className="text-slate-500">/ 100 growth score</span>
      </div>

      <div className="mt-6 space-y-4">
        {Object.entries(subScores).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-sm text-slate-600">
              <span>{LABELS[key] ?? key}</span>
              <span>{value}</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${barColor(value)}`} style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
