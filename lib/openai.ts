import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

export const PROMPT_VERSION = "v1";
export const PROMPT_TEMPLATE_KEY = "site-generation";

export const SITE_GENERATION_SYSTEM_PROMPT = `You are a copywriter generating website content for a healthcare clinic's marketing site, based strictly on real, verified data provided to you about that clinic. Your output will be published on a live website the clinic pays for and shows to real patients, so accuracy and restraint matter more than persuasive flair.

Hard rules — never break these:
1. Never state or imply medical efficacy, treatment outcomes, cure rates, or "best/#1/top-rated in [city]" claims. You have no data supporting such claims.
2. Never invent facts not present in the input data: no fabricated awards, certifications, years of experience, staff counts, equipment brands, or patient outcomes. If the input data doesn't mention something, omit it — do not fill the gap with a plausible-sounding guess.
3. Never provide medical advice, diagnostic suggestions, or treatment recommendations in the copy.
4. Write in a warm, professional, reassuring tone appropriate for a healthcare setting — not salesy, not hyperbolic.
5. If the input data is thin (e.g., no reviews, no listed services), write honest, general copy about the clinic's category and location rather than padding with invented specifics.
6. Output must be valid JSON matching the provided schema exactly. No text outside the JSON object.
7. Banned phrases regardless of context: "best", "#1", "leading", "guaranteed results", "top-rated".

You will receive structured data about one clinic: its name, address, category, opening hours, rating and review count, and (if available) a short editorial summary. Use only this data as your factual basis.`;

export type SiteGenerationInput = {
  name: string;
  category: string;
  address: string;
  city: string;
  formattedOpeningHours: string;
  rating: number | null;
  userRatingCount: number | null;
  editorialSummary: string | null;
  servicesListOrNone: string;
};

export function buildUserPrompt(input: SiteGenerationInput): string {
  return `Generate website content for the following clinic.

Clinic name: ${input.name}
Category: ${input.category}
Address: ${input.address}
City: ${input.city}
Opening hours: ${input.formattedOpeningHours}
Google rating: ${input.rating ?? "unknown"} (${input.userRatingCount ?? 0} reviews)
Editorial summary (if any): ${input.editorialSummary ?? "none"}
Known services (if any — otherwise infer only generic services typical of this category, phrased tentatively, e.g. "general and preventive care" rather than a specific named procedure): ${input.servicesListOrNone}

Generate:
1. A homepage headline (under 12 words) naming the clinic and its category/location — no superlatives.
2. A 2-3 paragraph "about" section: what the clinic is, where it is, what kind of care it offers, written from the available data only.
3. A services list (3-8 items) — named generically and tentatively if not explicitly provided in input data.
4. SEO meta title (under 60 characters) and meta description (under 155 characters), both including the clinic name and city.
5. A JSON-LD schema.org block of type "MedicalBusiness" (or the closest matching subtype for the category), populated only with fields you have real data for — name, address, telephone if provided, openingHours, aggregateRating if rating/review count are present. Omit any schema field you don't have real data for rather than guessing.

Return only the JSON object matching the schema below.`;
}

export const SITE_CONTENT_JSON_SCHEMA = {
  name: "clinic_site_content",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      headline: { type: "string" },
      about_copy: { type: "string" },
      services: { type: "array", items: { type: "string" } },
      seo_meta: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "description"],
      },
      json_ld: {
        type: "object",
        description: "A schema.org JSON-LD object, fields populated only where real source data exists.",
        additionalProperties: true,
      },
    },
    required: ["headline", "about_copy", "services", "seo_meta", "json_ld"],
  },
} as const;

export type GeneratedSiteContent = {
  headline: string;
  about_copy: string;
  services: string[];
  seo_meta: { title: string; description: string };
  json_ld: Record<string, unknown>;
};

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    client = new OpenAI({ apiKey });
  }
  return client;
}

/** Admin panel (requirements §11) can override the system prompt without a deploy. */
export async function resolveActivePrompt(): Promise<{ systemPrompt: string; version: string }> {
  const override = await prisma.promptTemplate.findUnique({ where: { key: PROMPT_TEMPLATE_KEY } });
  if (override) return { systemPrompt: override.content, version: override.version };
  return { systemPrompt: SITE_GENERATION_SYSTEM_PROMPT, version: PROMPT_VERSION };
}

export async function generateSiteContent(
  input: SiteGenerationInput
): Promise<{ content: GeneratedSiteContent; promptVersion: string }> {
  const openai = getClient();
  const { systemPrompt, version } = await resolveActivePrompt();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: buildUserPrompt(input) },
    ],
    response_format: { type: "json_schema", json_schema: SITE_CONTENT_JSON_SCHEMA },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned no content");

  return { content: JSON.parse(raw) as GeneratedSiteContent, promptVersion: version };
}

// --- v2 §1: reputation management -----------------------------------------

const REVIEW_REPLY_SYSTEM_PROMPT = `You are drafting a reply, on behalf of a healthcare clinic's owner, to one Google review of their clinic. The owner will read, edit, and personally post whatever you draft — you are not posting anything yourself.

Hard rules — never break these:
1. Never admit clinical or medical fault, never concede a diagnostic or treatment error, and never make any medical claim — even in response to a negative review. If the review describes a clinical concern, the reply should offer to discuss it privately (phone/in person), not address it in the public reply.
2. Never be defensive or argumentative, even when the review seems unfair. Stay polite and brief.
3. Reference something specific and real from the review text when possible (e.g. wait time, staff friendliness, cleanliness) — do not write a generic templated reply that could apply to any review.
4. Never invent facts about the clinic not given to you (no fabricated policies, staff names, or promises).
5. Keep it short: 2-4 sentences.
6. Thank the reviewer by first name if given.
7. Output must be valid JSON matching the schema exactly. No text outside the JSON object.`;

const REVIEW_REPLY_SCHEMA = {
  name: "review_reply",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      reply: { type: "string" },
    },
    required: ["reply"],
  },
} as const;

export async function generateReviewReply(params: {
  clinicName: string;
  authorName: string;
  rating: number;
  text: string | null;
}): Promise<string> {
  const openai = getClient();

  const userPrompt = `Clinic: ${params.clinicName}
Reviewer: ${params.authorName}
Rating: ${params.rating} / 5
Review text: ${params.text ?? "(no text — rating only)"}

Draft a reply.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: REVIEW_REPLY_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_schema", json_schema: REVIEW_REPLY_SCHEMA },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned no content");

  return (JSON.parse(raw) as { reply: string }).reply;
}

const SENTIMENT_SYSTEM_PROMPT = `You summarize a healthcare clinic's recent Google reviews into one short, honest rollup sentence for the clinic owner's dashboard. Base it strictly on the review text and ratings given — never invent a theme that isn't actually present in the reviews. If reviews are too few or too mixed to identify a clear pattern, say so plainly rather than forcing a conclusion. Output must be valid JSON matching the schema. No text outside the JSON object.`;

const SENTIMENT_SCHEMA = {
  name: "sentiment_summary",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
    },
    required: ["summary"],
  },
} as const;

export async function generateSentimentSummary(
  reviews: { rating: number; text: string | null }[]
): Promise<string> {
  if (reviews.length === 0) return "No reviews yet.";

  const openai = getClient();
  const userPrompt = reviews
    .map((r, i) => `${i + 1}. Rating ${r.rating}/5 — ${r.text ?? "(no text)"}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SENTIMENT_SYSTEM_PROMPT },
      { role: "user", content: `Recent reviews:\n${userPrompt}` },
    ],
    response_format: { type: "json_schema", json_schema: SENTIMENT_SCHEMA },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned no content");

  return (JSON.parse(raw) as { summary: string }).summary;
}
