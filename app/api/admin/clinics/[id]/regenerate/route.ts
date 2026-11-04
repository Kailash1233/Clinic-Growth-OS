import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generateSiteContent } from "@/lib/ai";
import { extractCity, formatOpeningHours } from "@/lib/clinicIngest";
import { generateSubdomainSlug } from "@/lib/slug";

/** Requirements §11: manually trigger regeneration for any clinic (bypasses the subscriber gate — admin action). */
export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: params.id } });
  if (!clinic) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let generated;
  try {
    generated = await generateSiteContent({
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
  } catch (err) {
    console.error("[admin/regenerate]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: `AI generation failed: ${err instanceof Error ? err.message.slice(0, 160) : "unknown error"}` }, { status: 502 });
  }

  await prisma.generationUsage.create({
    data: { api: "groq", userId: admin.id, clinicId: clinic.id, costEstimate: 0 },
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

  const settings = await prisma.siteSettings.findUnique({ where: { clinicId: clinic.id } });
  if (!settings) {
    await prisma.siteSettings.create({
      data: { clinicId: clinic.id, subdomainSlug: await generateSubdomainSlug(clinic.name), status: "draft" },
    });
  }

  return NextResponse.json({ ok: true, message: `New site copy: "${generated.content.headline}"` });
}
