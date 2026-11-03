import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { runHealthCheckAndScore } from "@/lib/clinicIngest";
import { getPlaceDetails } from "@/lib/placesProvider";

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
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: params.id } });
  if (!clinic) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let websiteUri: string | null = null;
  if (clinic.googlePlaceId) {
    try {
      const details = await getPlaceDetails(clinic.googlePlaceId);
      websiteUri = details.websiteUri;
    } catch {
      // fall back to no-site scoring if Places lookup fails
    }
  }

  const result = await runHealthCheckAndScore(clinic.id, websiteUri, {
    userRatingCount: clinic.reviewCount,
    businessStatus: "OPERATIONAL",
    hasPhotos: Array.isArray(clinic.photos) && (clinic.photos as unknown[]).length > 0,
    hasRegularOpeningHours: !!clinic.hours,
    hasWebsiteUri: !!websiteUri,
    rating: clinic.rating,
  });

  return NextResponse.json({ overall: result.score.overallScore, subScores: result.subScores });
}
