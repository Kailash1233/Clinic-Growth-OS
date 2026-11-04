import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { siteBaseUrl } from "@/lib/siteUrl";

/** Requirements §11: list all clinics with status. */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clinics = await prisma.clinic.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      scores: { orderBy: { computedAt: "desc" }, take: 1 },
      siteSettings: true,
      siteContent: { select: { id: true } },
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      users: { where: { role: "owner" }, select: { email: true }, take: 1 },
    },
  });

  return NextResponse.json({
    clinics: clinics.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      status: c.status,
      latestScore: c.scores[0]?.overallScore ?? null,
      siteStatus: c.siteSettings?.status ?? null,
      siteUrl: c.siteSettings && c.siteContent ? siteBaseUrl(c.siteSettings) : null,
      customDomain: c.siteSettings?.customDomain ?? null,
      subscriptionStatus: c.subscriptions[0]?.status ?? null,
      ownerEmail: c.users[0]?.email ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
