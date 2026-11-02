"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import ScoreImprovement from "@/components/report/ScoreImprovement";
import InsightsGrid from "@/components/report/InsightsGrid";
import SimpleHeader from "@/components/SimpleHeader";
import Testimonials from "@/components/landing/Testimonials";
import type { AuditResult } from "@/lib/runAudit";

function ReportContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const [result, setResult] = useState<AuditResult | null | "not-found">(null);

  useEffect(() => {
    if (!id) {
      setResult("not-found");
      return;
    }
    const raw = sessionStorage.getItem(`auditResult:${id}`);
    setResult(raw ? (JSON.parse(raw) as AuditResult) : "not-found");
  }, [id]);

  if (result === null) {
    return <main className="min-h-screen bg-white" />;
  }

  if (result === "not-found") {
    return (
      <div className="min-h-screen bg-white">
        <SimpleHeader />
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-ink-900">No report found here</h1>
          <p className="mt-2 text-ink-500">
            This build stores results only for the browser session that ran the audit (there's no
            database behind this version). Run a fresh audit from the homepage.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-mint-500 px-6 py-3 font-semibold text-white transition hover:bg-mint-600"
          >
            Back to homepage
          </Link>
        </main>
      </div>
    );
  }

  const { place, score, insights } = result;

  return (
    <div className="min-h-screen bg-white">
      <SimpleHeader />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <div className="animate-fade-in-up">
          <p className="text-sm font-semibold uppercase tracking-wide text-mint-500">Growth audit report</p>
          <h1 className="mt-2 text-3xl font-bold text-ink-900 sm:text-4xl">{place.name}</h1>
          <p className="mt-1 text-ink-500">
            {place.address ?? "Address unavailable"}
            {place.category ? ` · ${place.category}` : ""}
          </p>
        </div>

        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <ScoreImprovement overall={score.overall} />
        </div>

        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <ScoreBreakdown overall={score.overall} subScores={score.subScores} />
        </div>

        {insights.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-ink-900">What we found</h2>
            <InsightsGrid insights={insights} />
          </div>
        )}

        <div className="mt-10 animate-fade-in-up rounded-2xl border border-ink-100 bg-white p-8 text-center">
          <p className="text-lg font-bold text-ink-900">
            See exactly what a site built for you would look like.
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Get in touch — we&apos;ll generate a demo website for {place.name} in seconds, no
            commitment.
          </p>
          <a
            href="mailto:hello@yourbrand.in"
            className="mt-5 inline-block rounded-full bg-mint-500 px-6 py-3 font-semibold text-white transition hover:bg-mint-600"
          >
            Get started
          </a>
        </div>
      </main>

      <Testimonials />
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportContent />
    </Suspense>
  );
}
