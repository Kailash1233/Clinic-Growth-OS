import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { groqJson } from "@/lib/groq";

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

const SiteContentSchema = z.object({
  headline: z.string().min(1),
  about_copy: z.string().min(1),
  services: z.array(z.string().min(1)).min(1),
  seo_meta: z.object({ title: z.string().min(1), description: z.string().min(1) }),
  json_ld: z.record(z.unknown()),
});

const SITE_CONTENT_SHAPE = `{
  "headline": string,
  "about_copy": string (paragraphs separated by a blank line),
  "services": string[],
  "seo_meta": { "title": string, "description": string },
  "json_ld": object (schema.org JSON-LD)
}`;

export type GeneratedSiteContent = {
  headline: string;
  about_copy: string;
  services: string[];
  seo_meta: { title: string; description: string };
  json_ld: Record<string, unknown>;
};

/** Admin panel (requirements §11) can override the system prompt without a deploy. */
export async function resolveActivePrompt(): Promise<{ systemPrompt: string; version: string }> {
  const override = await prisma.promptTemplate.findUnique({ where: { key: PROMPT_TEMPLATE_KEY } });
  if (override) return { systemPrompt: override.content, version: override.version };
  return { systemPrompt: SITE_GENERATION_SYSTEM_PROMPT, version: PROMPT_VERSION };
}

export async function generateSiteContent(
  input: SiteGenerationInput
): Promise<{ content: GeneratedSiteContent; promptVersion: string }> {
  const { systemPrompt, version } = await resolveActivePrompt();
  const content = await groqJson({
    system: systemPrompt,
    user: buildUserPrompt(input),
    shape: SITE_CONTENT_SHAPE,
    schema: SiteContentSchema,
  });
  return { content, promptVersion: version };
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


export async function generateReviewReply(params: {
  clinicName: string;
  authorName: string;
  rating: number;
  text: string | null;
}): Promise<string> {
  const userPrompt = `Clinic: ${params.clinicName}
Reviewer: ${params.authorName}
Rating: ${params.rating} / 5
Review text: ${params.text ?? "(no text — rating only)"}

Draft a reply.`;

  const { reply } = await groqJson({
    system: REVIEW_REPLY_SYSTEM_PROMPT,
    user: userPrompt,
    shape: `{ "reply": string }`,
    schema: z.object({ reply: z.string().min(1) }),
  });
  return reply;
}

const SENTIMENT_SYSTEM_PROMPT = `You summarize a healthcare clinic's recent Google reviews into one short, honest rollup sentence for the clinic owner's dashboard. Base it strictly on the review text and ratings given — never invent a theme that isn't actually present in the reviews. If reviews are too few or too mixed to identify a clear pattern, say so plainly rather than forcing a conclusion. Output must be valid JSON matching the schema. No text outside the JSON object.`;


export async function generateSentimentSummary(
  reviews: { rating: number; text: string | null }[]
): Promise<string> {
  if (reviews.length === 0) return "No reviews yet.";

  const userPrompt = reviews
    .map((r, i) => `${i + 1}. Rating ${r.rating}/5 — ${r.text ?? "(no text)"}`)
    .join("\n");

  const { summary } = await groqJson({
    system: SENTIMENT_SYSTEM_PROMPT,
    user: `Recent reviews:
${userPrompt}`,
    shape: `{ "summary": string }`,
    schema: z.object({ summary: z.string().min(1) }),
  });
  return summary;
}

// --- SEO blog posts ------------------------------------------------------

export const BLOG_PROMPT_VERSION = "blog-v1";

const BLOG_SYSTEM_PROMPT = `You write SEO blog posts for a local healthcare/wellness clinic's website. Each post targets one local search keyword and answers real questions people type into Google. The clinic owner reviews and approves every post before it is published, but write as if it will be published as-is.

Hard rules — never break these:
1. Educational and general only. Never give medical advice, a diagnosis, or a treatment recommendation for an individual. Where relevant, say a qualified professional should assess each person's situation.
2. Never state or imply treatment outcomes, success/cure rates, or that a procedure is painless, risk-free, or guaranteed.
3. Never invent facts about the clinic: no fabricated prices, years of experience, staff names, qualifications, awards, equipment, or patient stories. Use only the clinic data provided. If asked about cost, explain what typically affects cost and say exact pricing comes from the clinic — never quote a number.
4. Never invent statistics, studies, or sources.
5. Banned phrases: "best", "#1", "leading", "top-rated", "guaranteed", "painless", "miracle".
6. Use the target keyword naturally in the title, the intro, and at least one section heading. Use supporting keywords only where they read naturally — no keyword stuffing.
7. Mention the clinic by name at most three times, naturally, mainly near the end. This is a helpful article first, not an advert.
8. Answer each provided search question in the FAQ, briefly and plainly (2-4 sentences each).
9. Write for readers in India in clear, simple English. Warm, professional tone.
10. Output must be valid JSON matching the schema exactly. No text outside the JSON object.`;

export type BlogGenerationInput = {
  clinicName: string;
  category: string;
  area: string | null;
  city: string | null;
  services: string[];
  targetKeyword: string;
  supportingKeywords: string[];
  questions: string[];
  existingTitles: string[];
};

export type GeneratedBlogPost = {
  title: string;
  slug: string;
  meta_description: string;
  intro: string;
  sections: { heading: string; body: string }[];
  faq: { question: string; answer: string }[];
};

const BlogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  meta_description: z.string().min(1),
  intro: z.string().min(1),
  sections: z.array(z.object({ heading: z.string().min(1), body: z.string().min(1) })).min(1),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
});

const BLOG_POST_SHAPE = `{
  "title": string (under 65 characters, includes the target keyword),
  "slug": string (lowercase-words-joined-by-hyphens, under 60 characters),
  "meta_description": string (under 155 characters),
  "intro": string,
  "sections": [{ "heading": string, "body": string }],
  "faq": [{ "question": string, "answer": string }]
}`;

export function buildBlogUserPrompt(input: BlogGenerationInput): string {
  const location = [input.area, input.city].filter(Boolean).join(", ") || "not specified";
  return `Write one SEO blog post for this clinic.

Clinic name: ${input.clinicName}
Category: ${input.category}
Location: ${location}
Services the clinic lists: ${input.services.length ? input.services.join("; ") : "none listed — keep service mentions generic"}

Target keyword: ${input.targetKeyword}
Supporting keywords: ${input.supportingKeywords.join("; ") || "none"}
Real Google search questions to answer in the FAQ:
${input.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Existing post titles on this blog (do not repeat these topics): ${input.existingTitles.join("; ") || "none yet"}

Structure: an intro of 2 short paragraphs, then 4-6 sections each with a heading and 1-3 paragraphs (separate paragraphs with a blank line), then the FAQ answering every question above. About 800-1100 words total. End the last section with a gentle, non-pushy line that readers in ${input.area ?? input.city ?? "the area"} can contact ${input.clinicName} to book a consultation.`;
}

export async function generateBlogPost(
  input: BlogGenerationInput
): Promise<{ post: GeneratedBlogPost; promptVersion: string }> {
  const post = await groqJson({
    system: BLOG_SYSTEM_PROMPT,
    user: buildBlogUserPrompt(input),
    shape: BLOG_POST_SHAPE,
    schema: BlogPostSchema,
  });
  return { post, promptVersion: BLOG_PROMPT_VERSION };
}
