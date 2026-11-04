import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { runHealthCheckAndScore } from "@/lib/clinicIngest";
import { getPlaceDetails } from "@/lib/places";

/** Latest score for a clinic. Public — the score is the hook, per requirements §5 step 2. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const score = await prisma.score.findFirst({
    where: { clinicId: params.id },
    orderBy: { computedAt: "desc" },
  });

  if (!score) return NextResponse.json({ error: "No score yet" }, { status: 404 });

  return NextResponse.json({ overall: score.overallScore, subScores: score.subScores, computedAt: score.computedAt });
}

/** Admin-triggered rescan (requirements §11: "manually trigger... a score refresh for any clinic"). */
export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: params.id } });
  if (!clinic) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!clinic.googlePlaceId) return NextResponse.json({ error: "Clinic has no linked Google Place" }, { status: 400 });

  let details;
  try {
    details = await getPlaceDetails(clinic.googlePlaceId);
  } catch (err) {
    console.error("[admin/rescan]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: `Google Places lookup failed: ${err instanceof Error ? err.message.slice(0, 160) : "unknown error"}` }, { status: 502 });
  }

  await prisma.clinic.update({
    where: { id: clinic.id },
    data: {
      name: details.name || clinic.name,
      address: details.address || clinic.address,
      phone: details.phone,
      category: details.category,
      hours: (details.hours as any) ?? undefined,
      rating: details.rating,
      reviewCount: details.userRatingCount,
      businessStatus: details.businessStatus,
    },
  });

  const result = await runHealthCheckAndScore(clinic.id, details.websiteUri, {
    userRatingCount: details.userRatingCount,
    businessStatus: details.businessStatus,
    hasPhotos: details.photos.length > 0,
    hasRegularOpeningHours: !!details.hours,
    hasWebsiteUri: !!details.websiteUri,
    rating: details.rating,
  });

  return NextResponse.json({
    overall: result.score.overallScore,
    subScores: result.subScores,
    message: `Rescanned: score ${result.score.overallScore}/100`,
  });
}
