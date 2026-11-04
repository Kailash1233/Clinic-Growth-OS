import Razorpay from "razorpay";
import crypto from "crypto";
import { requireEnv } from "@/lib/env";

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!client) {
    client = new Razorpay({ key_id: requireEnv("RAZORPAY_KEY_ID"), key_secret: requireEnv("RAZORPAY_KEY_SECRET") });
  }
  return client;
}

export type PlanTier = "starter" | "growth";

/** Plan IDs must be created in the Razorpay dashboard ahead of time and mapped here. */
export const PLAN_ID_BY_TIER: Record<PlanTier, string | undefined> = {
  starter: process.env.RAZORPAY_PLAN_STARTER,
  growth: process.env.RAZORPAY_PLAN_GROWTH,
};

export async function createSubscription(params: {
  planTier: PlanTier;
  customerNotifyEmail?: string;
  totalCount?: number; // billing cycles, e.g. 12 for a 12-month commitment
}) {
  const razorpay = getRazorpayClient();
  const planId = PLAN_ID_BY_TIER[params.planTier];
  if (!planId) throw new Error(`RAZORPAY_PLAN_${params.planTier.toUpperCase()} is not set`);

  // Razorpay needs a fixed number of billing cycles; aim for about 10 years
  // ("until cancelled") whatever the plan's billing period is.
  const plan = await razorpay.plans.fetch(planId);
  const perYear: Record<string, number> = { daily: 365, weekly: 52, monthly: 12, quarterly: 4, yearly: 1 };
  const cyclesPerYear = (perYear[plan.period] ?? 12) / Math.max(1, Number(plan.interval) || 1);
  const totalCount = params.totalCount ?? Math.max(1, Math.min(100, Math.round(cyclesPerYear * 10)));

  return razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: totalCount,
  });
}

/** Razorpay's own explanation of a failed API call, e.g. "The id provided does not exist". */
export function describeRazorpayError(err: unknown): string {
  const e = err as { statusCode?: number; error?: { description?: string; code?: string }; message?: string };
  return e?.error?.description || e?.message || (e?.statusCode ? `Razorpay returned ${e.statusCode}` : "Unknown Razorpay error");
}

/** Verifies the `X-Razorpay-Signature` header on incoming webhooks. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = requireEnv("RAZORPAY_WEBHOOK_SECRET");

  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  // timingSafeEqual throws on different lengths; a wrong-length signature is simply invalid.
  return given.length === expected.length && crypto.timingSafeEqual(expected, given);
}
