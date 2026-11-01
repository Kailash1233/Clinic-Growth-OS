import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import GenerateDemoButton from "@/components/GenerateDemoButton";
import CheckoutButton from "@/components/CheckoutButton";
import SimpleHeader from "@/components/SimpleHeader";

export default async function ClinicPage({ params }: { params: { id: string } }) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: params.id },
    include: {
      scores: { orderBy: { computedAt: "desc" }, take: 1 },
      siteContent: true,
      siteSettings: true,
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!clinic) notFound();

  const session = await getServerAuthSession();
  const score = clinic.scores[0];
  const activeSubscription = clinic.subscriptions[0]?.status === "active";
  const baseDomain = process.env.APP_BASE_DOMAIN ?? "yourbrand.in";

  return (
    <>
      <SimpleHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">{clinic.name}</h1>
      <p className="mt-1 text-slate-500">{clinic.address}</p>

      {score && (
        <div className="mt-8">
          <ScoreBreakdown overall={score.overallScore} subScores={score.subScores as Record<string, number>} />
        </div>
      )}

      <div className="mt-10">
        {!session ? (
          <div className="rounded-xl bg-slate-50 p-6 text-center">
            <p className="text-slate-700">Sign up to generate a free AI-built demo website for this clinic.</p>
            <Link
              href={`/login?next=/clinic/${clinic.id}`}
              className="mt-4 inline-block rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
            >
              Sign up free
            </Link>
          </div>
        ) : !clinic.siteContent ? (
          <GenerateDemoButton clinicId={clinic.id} />
        ) : (
          <div className="space-y-4 rounded-xl border border-slate-200 p-6">
            <p className="font-medium text-slate-900">{clinic.siteContent.headline}</p>
            {clinic.siteSettings && (
              <a
                href={`https://${clinic.siteSettings.subdomainSlug}.${baseDomain}`}
                target="_blank"
                rel="noreferrer"
                className="text-brand-700 underline"
              >
                View demo site →
              </a>
            )}
            {activeSubscription ? (
              <p className="font-medium text-green-700">Live and active.</p>
            ) : (
              <div className="flex flex-wrap gap-3 pt-2">
                <CheckoutButton clinicId={clinic.id} planTier="starter" clinicName={clinic.name} />
                <CheckoutButton clinicId={clinic.id} planTier="growth" clinicName={clinic.name} />
              </div>
            )}
          </div>
        )}
      </div>
      </main>
    </>
  );
}
