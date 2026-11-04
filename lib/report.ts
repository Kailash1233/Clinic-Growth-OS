import { prisma } from "@/lib/prisma";
import { generateInsights, type Insight } from "@/lib/insights";

/**
 * Everything the detailed Growth Report (web page and PDF) shows, rebuilt
 * from the stored audit using the same rules as lib/scoring.ts, so every
 * point in the score can be traced to a check.
 */

export type CheckStatus = "pass" | "partial" | "fail" | "unknown";
export type Check = { label: string; status: CheckStatus; detail: string; points: number; max: number };
export type Factor = {
  key: "visibility" | "siteHealth" | "reviews" | "conversionReadiness";
  label: string;
  weight: number; // share of the overall score, 0-1
  score: number; // 0-100
  contribution: number; // points this factor adds to the overall score
  summary: string;
  checks: Check[];
  recommendations: string[];
};

export type GrowthReport = {
  clinic: { id: string; name: string; address: string | null; category: string | null; phone: string | null };
  overall: number;
  band: { label: string; description: string };
  computedAt: Date;
  websiteUrl: string | null;
  factors: Factor[];
  insights: Insight[];
  topActions: string[];
  methodology: string[];
};

function band(score: number) {
  if (score >= 80) return { label: "Strong", description: "Patients can find, trust and contact you easily. Keep it fresh." };
  if (score >= 60) return { label: "Good", description: "A solid base with a few gaps that are costing you enquiries." };
  if (score >= 40) return { label: "Needs work", description: "Several fixable gaps are sending patients to other clinics." };
  return { label: "Priority", description: "Big, fixable gaps. Fixing the top items will make the largest difference." };
}

function tier(count: number | null): { points: number; label: string } {
  const c = count ?? 0;
  if (c === 0) return { points: 0, label: "no reviews yet" };
  if (c <= 9) return { points: 25, label: "1–9 reviews" };
  if (c <= 49) return { points: 50, label: "10–49 reviews" };
  if (c <= 149) return { points: 75, label: "50–149 reviews" };
  return { points: 100, label: "150+ reviews" };
}

const pct = (n: number) => Math.round(n);

export async function buildGrowthReport(clinicId: string): Promise<GrowthReport | null> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      scores: { orderBy: { computedAt: "desc" }, take: 1 },
      siteHealthChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
    },
  });
  const score = clinic?.scores[0];
  if (!clinic || !score) return null;

  const sub = score.subScores as Record<string, number>;
  const health = clinic.siteHealthChecks[0];
  const conv = (health?.conversionChecks ?? {}) as Record<string, boolean>;
  const conversion = {
    hasPhoneLink: !!conv.hasPhoneLink,
    hasBookingMechanism: !!conv.hasBookingMechanism,
    hasContactForm: !!conv.hasContactForm,
    hasAboveFoldClickToAction: !!conv.hasAboveFoldClickToAction,
  };
  const hasSite = !!health?.hasExistingSite;
  const photos = Array.isArray(clinic.photos) ? (clinic.photos as unknown[]).length : 0;
  const hasHours = !!clinic.hours;
  const reviewTier = tier(clinic.reviewCount);
  const operational = clinic.businessStatus ? clinic.businessStatus === "OPERATIONAL" : null;

  // --- Visibility ---------------------------------------------------------
  const completeness = [photos > 0, hasHours, hasSite].filter(Boolean).length;
  const visibility: Factor = {
    key: "visibility",
    label: "Google visibility",
    weight: 0.25,
    score: sub.visibility ?? 0,
    contribution: 0,
    summary: "How complete and prominent your Google Business Profile is. Google ranks local results by relevance, distance and prominence.",
    checks: [
      {
        label: "Number of Google reviews",
        status: reviewTier.points >= 75 ? "pass" : reviewTier.points > 0 ? "partial" : "fail",
        detail: `${clinic.reviewCount ?? 0} reviews (${reviewTier.label}) — ${reviewTier.points}/100 on this check`,
        points: reviewTier.points,
        max: 100,
      },
      {
        label: "Listed as open for business",
        status: operational === null ? "unknown" : operational ? "pass" : "fail",
        detail: operational === null ? "Status not reported by Google" : operational ? "Google shows the clinic as operational" : `Google shows: ${clinic.businessStatus}`,
        points: operational ? 100 : 0,
        max: 100,
      },
      {
        label: "Profile completeness (photos, hours, website)",
        status: completeness === 3 ? "pass" : completeness > 0 ? "partial" : "fail",
        detail: `${photos > 0 ? "Photos ✓" : "Photos ✗"} · ${hasHours ? "Opening hours ✓" : "Opening hours ✗"} · ${hasSite ? "Website ✓" : "Website ✗"} — ${pct((completeness / 3) * 100)}/100`,
        points: pct((completeness / 3) * 100),
        max: 100,
      },
    ],
    recommendations: [
      ...(reviewTier.points < 75 ? ["Ask every satisfied patient for a Google review (a QR code at reception works well). Aim for 50+."] : []),
      ...(photos === 0 ? ["Add at least 5 real photos: the outside and signboard, reception, a treatment room and your team."] : []),
      ...(!hasHours ? ["Add your opening hours to your Google Business Profile so you appear for 'open now' searches."] : []),
      ...(!hasSite ? ["Link a website from your Google profile — Clinic Growth can generate one for you."] : []),
      ...(operational === false ? ["Your Google listing is not marked as open. Check the status in your Business Profile."] : []),
    ],
  };

  // --- Site health ----------------------------------------------------------
  const perf = health?.loadSpeedScore ?? null;
  const seo = health?.seoScore ?? null;
  const a11y = health?.accessibilityScore ?? null;
  const metric = (v: number | null): CheckStatus => (v == null ? "unknown" : v >= 90 ? "pass" : v >= 50 ? "partial" : "fail");
  const siteHealth: Factor = {
    key: "siteHealth",
    label: "Website health",
    weight: 0.3,
    score: sub.siteHealth ?? 0,
    contribution: 0,
    summary: hasSite
      ? `Google Lighthouse (mobile) audit of ${health?.existingSiteUrl}. Performance and SEO count 40% each, accessibility 20%.`
      : "No website was found on your Google profile, so this factor scores 0. This is usually the single biggest fixable gap.",
    checks: hasSite
      ? [
          { label: "Mobile performance (40%)", status: metric(perf), detail: perf == null ? "Not measured" : `${perf}/100 — how fast the site loads on a phone`, points: perf ?? 0, max: 100 },
          { label: "SEO basics (40%)", status: metric(seo), detail: seo == null ? "Not measured" : `${seo}/100 — titles, descriptions, crawlability`, points: seo ?? 0, max: 100 },
          { label: "Accessibility (20%)", status: metric(a11y), detail: a11y == null ? "Not measured" : `${a11y}/100 — readable for every visitor`, points: a11y ?? 0, max: 100 },
          {
            label: "Can be indexed by Google",
            status: health?.isIndexed == null ? "unknown" : health.isIndexed ? "pass" : "fail",
            detail: health?.isIndexed == null ? "Could not check" : health.isIndexed ? "robots.txt and meta tags allow indexing" : "robots.txt or a noindex tag blocks Google",
            points: health?.isIndexed ? 100 : 0,
            max: 100,
          },
        ]
      : [{ label: "Website", status: "fail", detail: "No website linked from your Google profile", points: 0, max: 100 }],
    recommendations: hasSite
      ? [
          ...(perf != null && perf < 50 ? ["Speed up the site on mobile: compress images and remove heavy plugins or sliders."] : []),
          ...(seo != null && seo < 90 ? ["Give every page a clear title and meta description that mention your area and services."] : []),
          ...(a11y != null && a11y < 90 ? ["Improve contrast and add text descriptions to images so the site is easy for everyone to read."] : []),
          ...(health?.isIndexed === false ? ["Remove the noindex tag or robots.txt block so Google can show your site."] : []),
        ]
      : ["Launch a fast, mobile-first website. Clinic Growth builds one from your Google profile in about a minute."],
  };

  // --- Reviews ----------------------------------------------------------------
  const rating = clinic.rating;
  const reviews: Factor = {
    key: "reviews",
    label: "Reviews & reputation",
    weight: 0.2,
    score: sub.reviews ?? 0,
    contribution: 0,
    summary: "Your Google star rating, converted to a score out of 100.",
    checks: [
      {
        label: "Average Google rating",
        status: rating == null ? "fail" : rating >= 4.5 ? "pass" : rating >= 4 ? "partial" : "fail",
        detail: rating == null ? "No rating yet" : `${rating.toFixed(1)} out of 5 stars → ${pct((rating / 5) * 100)}/100`,
        points: rating == null ? 0 : pct((rating / 5) * 100),
        max: 100,
      },
    ],
    recommendations: [
      ...(rating == null || rating < 4.5 ? ["Reply to every review within a few days — the Reviews page drafts replies for you."] : []),
      ...(rating != null && rating < 4 ? ["Look for patterns in low-star reviews (waiting time, billing, communication) and fix the most common one first."] : []),
      "Keep reviews coming steadily: recent reviews matter more to patients than old ones.",
    ],
  };

  // --- Conversion -------------------------------------------------------------
  const signal = (ok: boolean, label: string, good: string, bad: string): Check => ({
    label,
    status: !hasSite ? "fail" : ok ? "pass" : "fail",
    detail: !hasSite ? "No website to check" : ok ? good : bad,
    points: ok ? 25 : 0,
    max: 25,
  });
  const conversionReadiness: Factor = {
    key: "conversionReadiness",
    label: "Conversion readiness",
    weight: 0.25,
    score: sub.conversionReadiness ?? 0,
    contribution: 0,
    summary: "Whether a visitor can contact you in one tap. Each of the four signals is worth 25 points.",
    checks: [
      signal(conversion.hasPhoneLink, "Click-to-call phone link", "A tap-to-call link was found", "No tap-to-call (tel:) link found"),
      signal(conversion.hasBookingMechanism, "Way to book an appointment", "A booking link, form or WhatsApp link was found", "No booking link, form or WhatsApp link found"),
      signal(conversion.hasContactForm, "Contact form", "A contact form was found", "No contact form found"),
      signal(conversion.hasAboveFoldClickToAction, "Call or WhatsApp button near the top", "Visible without scrolling", "Not visible near the top of the page"),
    ],
    recommendations: [
      ...(!conversion.hasPhoneLink ? ["Add a 'Call now' button that opens the phone dialler."] : []),
      ...(!conversion.hasBookingMechanism ? ["Offer a simple way to book: a form, a WhatsApp link or an online booking page."] : []),
      ...(!conversion.hasContactForm ? ["Add a short contact form (name, phone, message) so patients can reach you after hours."] : []),
      ...(!conversion.hasAboveFoldClickToAction ? ["Put the Call and WhatsApp buttons at the very top of the home page."] : []),
    ],
  };

  const factors = [visibility, siteHealth, reviews, conversionReadiness].map((f) => ({
    ...f,
    contribution: Math.round(f.score * f.weight * 10) / 10,
  }));

  // Most points available first: weight × missing score.
  const topActions = [...factors]
    .sort((a, b) => b.weight * (100 - b.score) - a.weight * (100 - a.score))
    .flatMap((f) => f.recommendations.slice(0, 2))
    .slice(0, 5);

  return {
    clinic: { id: clinic.id, name: clinic.name, address: clinic.address, category: clinic.category, phone: clinic.phone },
    overall: score.overallScore,
    band: band(score.overallScore),
    computedAt: score.computedAt,
    websiteUrl: health?.existingSiteUrl ?? null,
    factors,
    insights: generateInsights({
      category: clinic.category,
      rating: clinic.rating,
      reviewCount: clinic.reviewCount,
      hasPhotos: photos > 0,
      hasExistingSite: hasSite,
      conversion,
    }),
    topActions,
    methodology: [
      "Overall score = Visibility × 25% + Website health × 30% + Reviews × 20% + Conversion readiness × 25%.",
      "Visibility: average of review-count tier (0/25/50/75/100 for 0, 1–9, 10–49, 50–149, 150+ reviews), open-for-business status, and profile completeness.",
      "Website health: Google Lighthouse mobile scores (performance 40%, SEO 40%, accessibility 20%); 0 when there is no website.",
      "Reviews: star rating ÷ 5 × 100.",
      "Conversion readiness: 25 points each for a click-to-call link, a booking method, a contact form and a call/WhatsApp button near the top.",
      "Data sources: Google Places API (Business Profile), Google PageSpeed Insights, and a scan of the clinic's own website.",
    ],
  };
}
