import type { SiteGenerationInput, GeneratedSiteContent, BlogGenerationInput, GeneratedBlogPost } from "@/lib/openai";

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

const SMALL_WORDS = new Set(["in", "near", "of", "for", "and", "the", "a", "an", "to", "at"]);

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Keywords are stored lowercase; restore the real casing of the area/city inside them for display. */
function displayKeyword(keyword: string, area: string | null, city: string | null): string {
  let out = keyword;
  for (const place of [area, city]) {
    if (place) out = out.replace(new RegExp(place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), place);
  }
  return out;
}

/** Answers kept deliberately general — same rules as the real blog prompt: no prices, no outcomes, no advice. */
function mockFaqAnswer(question: string, clinicName: string): string {
  const q = question.toLowerCase();
  if (q.includes("cost") || q.includes("price") || q.includes("charge")) {
    return `Cost depends on what each person needs, which can only be worked out after an assessment. Factors include the type of treatment, how many visits it takes, and any materials involved. ${clinicName} can explain the options and costs after a consultation.`;
  }
  if (q.includes("how long") || q.includes("how many")) {
    return "It varies from person to person. A professional can give you a realistic idea of the time involved once they have assessed your situation.";
  }
  if (q.includes("choose") || q.includes("which") || q.includes("good")) {
    return "Look at how easy the clinic is to reach, its opening hours, recent patient reviews, and whether the team explains options clearly before starting any treatment.";
  }
  return "The honest answer depends on your individual situation. It's best discussed with a qualified professional who can assess you in person and explain your options.";
}

export function mockGenerateBlogPost(input: BlogGenerationInput): GeneratedBlogPost {
  const place = input.area ?? input.city ?? "your area";
  const phrase = displayKeyword(input.targetKeyword, input.area, input.city);
  const keyword = titleCase(phrase);
  const title = `${keyword}: A Simple Guide for Patients`.slice(0, 65);
  return {
    title,
    slug: input.targetKeyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-guide",
    meta_description: `Looking for ${phrase}? What to know before you visit, common questions answered, and how to choose a clinic in ${place}.`.slice(0, 155),
    intro: `If you are searching for ${phrase}, you probably have a few practical questions before booking a visit. This guide covers what to look for, what to expect, and answers to the questions people in ${place} most often ask.\n\nEvery person's situation is different, so treat this as general information and speak to a qualified professional about your own needs.`,
    sections: [
      {
        heading: `What to know about ${phrase}`,
        body: `Start with the basics: a convenient location, opening hours that fit your routine, and a team that explains things clearly. Recent reviews from other patients in ${place} can give you a feel for the experience.\n\nA good clinic will take time to understand your concerns before suggesting anything.`,
      },
      {
        heading: "What to expect at your first visit",
        body: "Your first visit usually starts with a conversation about your concerns and history, followed by an assessment. You should leave understanding your options, without pressure to decide on the spot.",
      },
      {
        heading: "Questions worth asking",
        body: "Ask what the options are, how many visits may be needed, what aftercare involves, and how costs are worked out. Clear answers to these questions are a good sign.",
      },
      {
        heading: `Booking an appointment in ${place}`,
        body: `If you are in or near ${place}, ${input.clinicName} is happy to talk through your questions. You can call or message the clinic to book a consultation at a time that suits you.`,
      },
    ],
    faq: input.questions.map((question) => ({ question, answer: mockFaqAnswer(question, input.clinicName) })),
  };
}
