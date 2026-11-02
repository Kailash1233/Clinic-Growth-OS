import type { SiteGenerationInput, GeneratedSiteContent } from "@/lib/openai";

/**
 * Demo-mode stand-ins for the OpenAI calls, written in the same voice and
 * under the same guardrails as the real prompts (lib/openai.ts) — no
 * invented facts, no superlatives, no clinical/outcome claims — so the
 * output reads like a real model draft, not a placeholder.
 */

function isChessAcademy(input: SiteGenerationInput): boolean {
  return input.name.toLowerCase().includes("srinivasan") || input.name.toLowerCase().includes("chess");
}

export function mockGenerateSiteContent(input: SiteGenerationInput): GeneratedSiteContent {
  if (isChessAcademy(input)) {
    return {
      headline: `${input.name} — Chess Coaching in ${input.city}`,
      about_copy: `${input.name} offers structured chess coaching for students of all levels in ${input.city}. Classes run on weekday evenings and weekend mornings, with small batch sizes so each student gets individual attention on openings, tactics, and endgame fundamentals.\n\nThe academy has built a strong local reputation over time, reflected in its Google rating from parents and students. Sessions are conducted in person at the academy premises in ${input.address.split(",")[1]?.trim() ?? input.city}.`,
      services: [
        "Beginner chess classes",
        "Intermediate tactics training",
        "Tournament preparation",
        "One-on-one coaching sessions",
        "Weekend batch classes",
      ],
      seo_meta: {
        title: `${input.name} – Chess Coaching in ${input.city}`.slice(0, 60),
        description: `${input.name} offers chess coaching for all levels in ${input.city}. View batch timings, fees, and contact details.`.slice(0, 155),
      },
      json_ld: {
        "@context": "https://schema.org",
        "@type": "SportsActivityLocation",
        name: input.name,
        address: input.address,
        ...(input.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: input.rating, reviewCount: input.userRatingCount ?? 0 } } : {}),
      },
    };
  }

  const services =
    input.servicesListOrNone && input.servicesListOrNone !== "none"
      ? input.servicesListOrNone.split(",").map((s) => s.trim()).filter(Boolean)
      : [`General ${input.category.toLowerCase()} services`, "Consultations", "Appointments by request"];

  return {
    headline: `${input.name} — ${input.category} in ${input.city}`,
    about_copy: `${input.name} is a ${input.category.toLowerCase()} based in ${input.city}, serving the local community${
      input.userRatingCount ? ` with a track record reflected in its Google reviews` : ""
    }.\n\nVisitors can get in touch directly to learn more about current offerings, pricing, and availability at ${input.address}.`,
    services,
    seo_meta: {
      title: `${input.name} – ${input.category} in ${input.city}`.slice(0, 60),
      description: `${input.name}, a ${input.category.toLowerCase()} in ${input.city}. Contact details, hours, and more.`.slice(0, 155),
    },
    json_ld: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: input.name,
      address: input.address,
      ...(input.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: input.rating, reviewCount: input.userRatingCount ?? 0 } } : {}),
    },
  };
}

const REPLY_TEMPLATES: Record<"positive" | "neutral" | "negative", (name: string, firstWord: string) => string> = {
  positive: (name, first) =>
    `Thank you so much, ${first}! We really appreciate you taking the time to share this — it means a lot to the whole team at ${name}.`,
  neutral: (name, first) =>
    `Thanks for the honest feedback, ${first} — glad the core experience worked for you. We're taking the rest on board and working to improve it.`,
  negative: (name, first) =>
    `Thank you for letting us know, ${first}. We'd like to understand this better — please reach out to us directly so we can make it right.`,
};

export function mockGenerateReviewReply(params: { clinicName: string; authorName: string; rating: number; text: string | null }): string {
  const first = params.authorName.split(" ")[0] || "there";
  const tone = params.rating >= 4 ? "positive" : params.rating === 3 ? "neutral" : "negative";
  return REPLY_TEMPLATES[tone](params.clinicName, first);
}

export function mockGenerateSentimentSummary(reviews: { rating: number; text: string | null }[]): string {
  if (reviews.length === 0) return "No reviews yet.";
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const mentionsWebsite = reviews.some((r) => /website|online|call/i.test(r.text ?? ""));
  if (avg >= 4.2) {
    return mentionsWebsite
      ? "Mostly positive — reviewers consistently praise the service, with a recurring note that it's hard to find information online before visiting."
      : "Mostly positive, with consistent praise for service quality across recent reviews.";
  }
  if (avg >= 3.5) return "Generally positive with a few mixed reviews — no single recurring complaint stands out.";
  return "Mixed sentiment recently — worth a closer look at the lower-rated reviews.";
}
