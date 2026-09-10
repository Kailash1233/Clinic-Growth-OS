import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateSiteContent } from "@/lib/openai";
import { generateSubdomainSlug } from "@/lib/slug";
import { extractCity, formatOpeningHours } from "@/lib/clinicIngest";

/**
 * AI demo generation — requirements §5 step 4, gated behind a verified account
 * (§10: never allow generation pre-signup). Quota: one free generation per
 * account; regeneration requires an active subscription for that clinic (§10).
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: params.id } });
  if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 404 });

  const existingContent = await prisma.siteContent.findUnique({ where: { clinicId: clinic.id } });

  if (existingContent) {
    const activeSub = await prisma.subscription.findFirst({
      where: { clinicId: clinic.id, status: "active" },
    });
    if (!activeSub) {
      return NextResponse.json(
        { error: "Regeneration requires an active subscription for this clinic." },
        { status: 403 }
      );
    }
  } else {
    const priorFreeGeneration = await prisma.generationUsage.findFirst({
      where: { userId: user.id, api: "openai" },
    });
    if (priorFreeGeneration) {
      return NextResponse.json(
        { error: "You've used your free demo generation. Subscribe to regenerate." },
        { status: 403 }
      );
    }
  }

  const generated = await generateSiteContent({
    name: clinic.name,
    category: clinic.category ?? "Clinic",
    address: clinic.address ?? "",
    city: extractCity(clinic.address ?? ""),
    formattedOpeningHours: formatOpeningHours(clinic.hours),
    rating: clinic.rating,
    userRatingCount: clinic.reviewCount,
    editorialSummary: null,
    servicesListOrNone: "none",
  });

  await prisma.generationUsage.create({
    data: { api: "openai", userId: user.id, clinicId: clinic.id, costEstimate: 0.01 },
  });

  await prisma.siteContent.upsert({
    where: { clinicId: clinic.id },
    create: {
      clinicId: clinic.id,
      headline: generated.content.headline,
      aboutCopy: generated.content.about_copy,
      services: generated.content.services,
      seoMeta: generated.content.seo_meta,
      jsonLd: generated.content.json_ld as any,
      promptVersion: generated.promptVersion,
    },
    update: {
      headline: generated.content.headline,
      aboutCopy: generated.content.about_copy,
      services: generated.content.services,
      seoMeta: generated.content.seo_meta,
      jsonLd: generated.content.json_ld as any,
      promptVersion: generated.promptVersion,
      generatedAt: new Date(),
    },
  });

  let siteSettings = await prisma.siteSettings.findUnique({ where: { clinicId: clinic.id } });
  if (!siteSettings) {
    const subdomainSlug = await generateSubdomainSlug(clinic.name);
    siteSettings = await prisma.siteSettings.create({
      data: { clinicId: clinic.id, subdomainSlug, status: "draft" },
    });
  }

  if (!user.clinicId) {
    await prisma.user.update({ where: { id: user.id }, data: { clinicId: clinic.id } });
  }

  await prisma.clinic.update({ where: { id: clinic.id }, data: { status: "demo" } });

  const baseDomain = process.env.APP_BASE_DOMAIN ?? "yourbrand.in";

  return NextResponse.json({
    content: generated.content,
    demoUrl: `https://${siteSettings.subdomainSlug}.${baseDomain}`,
    status: siteSettings.status,
  });
}
