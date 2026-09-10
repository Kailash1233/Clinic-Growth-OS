import Razorpay from "razorpay";
import crypto from "crypto";

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!client) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) throw new Error("Razorpay keys are not configured");
    client = new Razorpay({ key_id, key_secret });
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
  if (!planId) throw new Error(`No Razorpay plan configured for tier "${params.planTier}"`);

  return razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: params.totalCount ?? 120, // effectively "until cancelled" for a monthly plan
  });
}

/** Verifies the `X-Razorpay-Signature` header on incoming webhooks. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
