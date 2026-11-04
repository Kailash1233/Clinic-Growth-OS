import { unstable_cache } from "next/cache";
import { getRazorpayClient, PLAN_ID_BY_TIER, type PlanTier } from "@/lib/razorpay";

export type PlanInfo = {
  tier: PlanTier;
  name: string;
  description: string | null;
  amountPaise: number | null;
  currency: string;
  period: string | null; // "monthly", "yearly"…
};

export const PLAN_FEATURES = [
  "AI-built, mobile-first clinic website",
  "Your own domain with free HTTPS",
  "Lead inbox: contact form, call and WhatsApp taps",
  "Google review inbox with AI-drafted replies",
  "Weekly SEO blog drafts you approve",
  "Weekly Google photo reminders",
  "Detailed Growth Report you can download",
];

const fallbackName: Record<PlanTier, string> = { starter: "Starter", growth: "Growth" };

async function fetchPlans(): Promise<PlanInfo[]> {
  const tiers: PlanTier[] = ["starter", "growth"];
  return Promise.all(
    tiers.map(async (tier) => {
      const id = PLAN_ID_BY_TIER[tier];
      try {
        if (!id) throw new Error("missing plan id");
        const plan = await getRazorpayClient().plans.fetch(id);
        const period = plan.interval === 1 ? plan.period : `every ${plan.interval} ${plan.period}`;
        return {
          tier,
          name: plan.item.name || fallbackName[tier],
          description: plan.item.description || null,
          amountPaise: Number(plan.item.amount),
          currency: plan.item.currency,
          period: String(period),
        };
      } catch (err) {
        console.error(`[plans] could not load ${tier} plan from Razorpay:`, err instanceof Error ? err.message : err);
        return { tier, name: fallbackName[tier], description: null, amountPaise: null, currency: "INR", period: null };
      }
    })
  );
}

/** Plans as configured in Razorpay (name, description, price), cached for an hour. */
export const getPlans = unstable_cache(fetchPlans, ["razorpay-plans"], { revalidate: 3600 });

export function formatPrice(plan: PlanInfo): string {
  if (plan.amountPaise == null) return "See price at checkout";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: plan.currency, maximumFractionDigits: 0 }).format(plan.amountPaise / 100);
}

export function periodLabel(period: string | null): string {
  if (!period) return "";
  return { monthly: "/ month", yearly: "/ year", weekly: "/ week", daily: "/ day" }[period] ?? period;
}
