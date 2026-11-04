import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import PlanCards from "@/components/PlanCards";
import { getPlans } from "@/lib/plans";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pricing — Clinic Growth" };

export default async function PricingPage() {
  const [plans, session] = await Promise.all([getPlans(), getServerAuthSession()]);
  const clinic = session?.user?.clinicId
    ? await prisma.clinic.findUnique({
        where: { id: session.user.clinicId },
        select: { id: true, name: true, siteContent: { select: { id: true } }, subscriptions: { where: { status: "active" }, take: 1 } },
      })
    : null;

  return (
    <>
      <Nav />
      <main className="bg-slate-50 px-6 pb-24 pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-mint-500">Pricing</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">Simple plans for growing clinics</h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-500">
            Your Growth Score and a preview website are free. Pick a plan when you&apos;re ready to put your site live.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-4xl">
          <PlanCards
            plans={plans}
            clinicId={clinic?.siteContent ? clinic.id : null}
            clinicName={clinic?.name}
            activeTier={clinic?.subscriptions[0]?.planTier ?? null}
            signedIn={!!session?.user}
          />
          <p className="mt-6 text-center text-xs text-ink-400">Prices include billing through Razorpay. Cancel any time; your site stays up as a preview.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
