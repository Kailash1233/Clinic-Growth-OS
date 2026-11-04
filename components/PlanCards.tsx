import Link from "next/link";
import { Check } from "lucide-react";
import CheckoutButton from "@/components/CheckoutButton";
import { formatPrice, periodLabel, PLAN_FEATURES, type PlanInfo } from "@/lib/plans";

/**
 * Plan cards. With a clinicId the button opens Razorpay checkout for that
 * clinic; without one it starts the free audit (the site has to exist first).
 */
export default function PlanCards({
  plans,
  clinicId,
  clinicName,
  activeTier,
  signedIn,
}: {
  plans: PlanInfo[];
  clinicId?: string | null;
  clinicName?: string;
  activeTier?: string | null;
  signedIn?: boolean;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {plans.map((plan, i) => {
        const featured = i === plans.length - 1;
        const isActive = activeTier === plan.tier;
        return (
          <div
            key={plan.tier}
            className={`relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm ${featured ? "border-mint-500 ring-1 ring-mint-500" : "border-slate-200"}`}
          >
            {featured && (
              <span className="absolute -top-3 left-7 rounded-full bg-mint-500 px-3 py-1 text-xs font-semibold text-white">Most popular</span>
            )}
            <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
            {plan.description && <p className="mt-1 text-sm text-slate-500">{plan.description}</p>}
            {plan.amountPaise != null ? (
              <p className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-slate-900">{formatPrice(plan)}</span>
                <span className="text-sm text-slate-500">{periodLabel(plan.period)}</span>
              </p>
            ) : (
              <p className="mt-5 text-base font-semibold text-slate-700">Price shown at checkout</p>
            )}
            <ul className="mt-6 flex-1 space-y-2.5">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-500" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              {isActive ? (
                <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-center text-sm font-semibold text-emerald-700">Your current plan</p>
              ) : clinicId ? (
                <CheckoutButton clinicId={clinicId} planTier={plan.tier} clinicName={clinicName ?? ""} label={`Choose ${plan.name}`} block />
              ) : (
                <Link
                  href={signedIn ? "/" : "/login?next=/pricing"}
                  className="block rounded-lg bg-mint-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-mint-600"
                >
                  {signedIn ? "Run your free audit first" : "Get started free"}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
