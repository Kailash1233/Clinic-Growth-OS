import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { syncClinicReviews } from "@/lib/reviewsSync";

/** v2 §1, admin-triggered version of requirements §11's "manually trigger" pattern. */
export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: params.id } });
  if (!clinic) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!clinic.googlePlaceId) {
    return NextResponse.json({ error: "Clinic has no linked Google Place" }, { status: 400 });
  }

  try {
    const count = await syncClinicReviews(clinic.id, clinic.googlePlaceId);
    return NextResponse.json({ ok: true, count, message: `${count} review${count === 1 ? "" : "s"} synced from Google` });
  } catch (err) {
    console.error("[admin/reviews-sync]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: `Google reviews fetch failed: ${err instanceof Error ? err.message.slice(0, 160) : "unknown error"}` }, { status: 502 });
  }
}
