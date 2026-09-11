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
