import Link from "next/link";
import { CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlans } from "@/lib/plans";
import PlanCards from "@/components/PlanCards";
import { Badge, Card, EmptyState, PageHeader, buttonStyles, statusTone } from "@/components/app/ui";

export default async function BillingPage() {
  const user = await requireUser();
  const clinic = user.clinicId
    ? await prisma.clinic.findUnique({
        where: { id: user.clinicId },
        select: {
          id: true,
          name: true,
          siteContent: { select: { id: true } },
          subscriptions: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      })
    : null;

  if (!clinic?.siteContent) {
    return (
      <>
        <PageHeader title="Plan & billing" description="Choose a plan once your website preview is ready." />
        <EmptyState
          icon={<CreditCard className="h-6 w-6" />}
          title="Generate your website first"
          description="Run a free audit of your clinic and generate the site. Then pick a plan here to put it live."
          action={
            <Link href="/" className={buttonStyles.primary}>
              Start free audit
            </Link>
          }
        />
      </>
    );
  }

  const plans = await getPlans();
  const active = clinic.subscriptions.find((s) => s.status === "active");
  const latest = clinic.subscriptions[0];

  return (
    <>
      <PageHeader title="Plan & billing" description={`Subscription for ${clinic.name}. Payments are handled securely by Razorpay.`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Current plan" className="lg:col-span-1">
          {latest ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Plan</dt>
                <dd className="font-semibold capitalize text-slate-900">{latest.planTier}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <Badge tone={statusTone(latest.status)}>{latest.status.replace("_", " ")}</Badge>
                </dd>
              </div>
              {latest.currentPeriodEnd && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Renews</dt>
                  <dd className="font-medium text-slate-900">{latest.currentPeriodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</dd>
                </div>
              )}
              {latest.status === "past_due" && !active && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  Payment not confirmed yet. If you just paid, this updates within a minute; otherwise choose a plan again.
                </p>
              )}
            </dl>
          ) : (
            <p className="text-sm text-slate-500">You&apos;re on the free preview. Your site shows a preview banner until you subscribe.</p>
          )}
        </Card>
        <div className="lg:col-span-2">
          <PlanCards plans={plans} clinicId={clinic.id} clinicName={clinic.name} activeTier={active?.planTier ?? null} signedIn />
        </div>
      </div>
    </>
  );
}
