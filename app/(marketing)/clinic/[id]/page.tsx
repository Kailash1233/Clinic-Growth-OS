import { siteBaseUrl } from "@/lib/siteUrl";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import ScoreImprovement from "@/components/report/ScoreImprovement";
import InsightsGrid from "@/components/report/InsightsGrid";
import GenerateDemoButton from "@/components/GenerateDemoButton";
import CheckoutButton from "@/components/CheckoutButton";
import SimpleHeader from "@/components/SimpleHeader";
import { generateInsights } from "@/lib/insights";
import { buildGrowthReport } from "@/lib/report";
import DetailedReport, { DownloadReportButton } from "@/components/report/DetailedReport";

export default async function ClinicPage({ params }: { params: { id: string } }) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: params.id },
    include: {
      scores: { orderBy: { computedAt: "desc" }, take: 1 },
      siteHealthChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
      siteContent: true,
      siteSettings: true,
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!clinic) notFound();

  const session = await getServerAuthSession();
  const report = await buildGrowthReport(clinic.id);
  const score = clinic.scores[0];
  const health = clinic.siteHealthChecks[0];
  const activeSubscription = clinic.subscriptions[0]?.status === "active";

  const conversion = (health?.conversionChecks as Record<string, boolean> | null) ?? {
    hasPhoneLink: false,
    hasBookingMechanism: false,
    hasContactForm: false,
    hasAboveFoldClickToAction: false,
  };

  const insights = generateInsights({
    category: clinic.category,
    rating: clinic.rating,
    reviewCount: clinic.reviewCount,
    hasPhotos: Array.isArray(clinic.photos) ? clinic.photos.length > 0 : !!clinic.photos,
    hasExistingSite: health?.hasExistingSite ?? false,
    conversion: {
      hasPhoneLink: conversion.hasPhoneLink ?? false,
      hasBookingMechanism: conversion.hasBookingMechanism ?? false,
      hasContactForm: conversion.hasContactForm ?? false,
      hasAboveFoldClickToAction: conversion.hasAboveFoldClickToAction ?? false,
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <SimpleHeader />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <div className="animate-fade-in-up">
          <p className="text-sm font-semibold uppercase tracking-wide text-mint-500">Growth audit report</p>
          <h1 className="mt-2 text-3xl font-bold text-ink-900 sm:text-4xl">{clinic.name}</h1>
          <p className="mt-1 text-ink-500">
            {clinic.address ?? "Address unavailable"}
            {clinic.category ? ` · ${clinic.category}` : ""}
          </p>
          {report && <DownloadReportButton clinicId={clinic.id} className="mt-5" />}
        </div>

        {score && (
          <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            <ScoreImprovement overall={score.overallScore} />
          </div>
        )}

        {score && (
          <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            <ScoreBreakdown overall={score.overallScore} subScores={score.subScores as Record<string, number>} />
          </div>
        )}

        {insights.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-ink-900">What we found</h2>
            <InsightsGrid insights={insights} />
          </div>
        )}

        {report && (
          <div className="mt-12">
            <h2 className="mb-1 text-xl font-bold text-ink-900">Detailed report</h2>
            <p className="mb-5 text-sm text-ink-500">Every check behind your score, and exactly what to fix.</p>
            <DetailedReport report={report} />
          </div>
        )}

        <div className="mt-10">
          {!session ? (
            <div className="animate-fade-in-up rounded-2xl border border-ink-100 bg-white p-8 text-center">
              <p className="text-lg font-bold text-ink-900">
                See exactly what a site built for you would look like.
              </p>
              <p className="mt-1 text-sm text-ink-500">
                Sign up free — we&apos;ll generate a demo website for {clinic.name} in seconds, no commitment.
              </p>
              <Link
                href={`/login?next=/clinic/${clinic.id}`}
                className="mt-5 inline-block rounded-full bg-mint-500 px-6 py-3 font-semibold text-white transition hover:bg-mint-600"
              >
                Sign up free
              </Link>
            </div>
          ) : !clinic.siteContent ? (
            <div className="animate-fade-in-up rounded-2xl border border-ink-100 bg-white p-8 text-center">
              <p className="text-lg font-bold text-ink-900">Generate your free AI demo site</p>
              <p className="mt-1 text-sm text-ink-500">
                We&apos;ll write headline, services, and SEO copy tailored to {clinic.name} — ready in moments.
              </p>
              <div className="mt-5 flex justify-center">
                <GenerateDemoButton clinicId={clinic.id} />
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up space-y-5 rounded-2xl border border-ink-100 bg-white p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-mint-500">Your generated site</p>
                <p className="mt-1 text-xl font-bold text-ink-900">{clinic.siteContent.headline}</p>
              </div>
              {clinic.siteSettings && (
                <a
                  href={siteBaseUrl(clinic.siteSettings) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-mint-500 hover:underline"
                >
                  View demo site →
                </a>
              )}
              <Link href="/dashboard" prefetch={false} className="ml-4 inline-flex items-center gap-1 font-semibold text-ink-700 hover:underline">
                Open dashboard →
              </Link>
              {activeSubscription ? (
                <p className="inline-flex items-center gap-2 rounded-full bg-mint-100 px-3 py-1.5 text-sm font-semibold text-mint-500">
                  Live and active
                </p>
              ) : (
                <div className="flex flex-wrap gap-3 pt-1">
                  <CheckoutButton clinicId={clinic.id} planTier="starter" clinicName={clinic.name} />
                  <CheckoutButton clinicId={clinic.id} planTier="growth" clinicName={clinic.name} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
