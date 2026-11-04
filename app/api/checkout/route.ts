import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createSubscription, describeRazorpayError, type PlanTier } from "@/lib/razorpay";

const bodySchema = z.object({
  clinicId: z.string(),
  planTier: z.enum(["starter", "growth"]),
});

/** Requirements §5 step 5: owner reviews the demo, activates, completes Razorpay Checkout. */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { clinicId, planTier } = parsed.data;

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  if (user.clinicId !== clinic.id && user.role !== "admin") {
    return NextResponse.json({ error: "Generate this clinic's site from your account first." }, { status: 403 });
  }

  let rzpSubscription;
  try {
    rzpSubscription = await createSubscription({
      planTier: planTier as PlanTier,
      customerNotifyEmail: user.email ?? undefined,
    });
  } catch (err) {
    const reason = describeRazorpayError(err);
    console.error(`[checkout] ${planTier}: ${reason}`, err);
    return NextResponse.json({ error: `Couldn't start the payment: ${reason}` }, { status: 502 });
  }

  await prisma.subscription.create({
    data: {
      userId: user.id,
      clinicId: clinic.id,
      razorpaySubscriptionId: rzpSubscription.id,
      planTier,
      status: "past_due", // flips to active on the razorpay webhook once payment clears
    },
  });

  return NextResponse.json({
    subscriptionId: rzpSubscription.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
}
