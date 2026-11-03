/**
 * The one place every caller should import AI generation from. Real vs.
 * mock is decided here, once, by whether OPENAI_API_KEY is set — add the
 * key to `.env` and every caller switches to real OpenAI calls
 * automatically, no code changes anywhere else. See lib/demoMode.ts.
 */
import { demoFlags, demoDelay } from "@/lib/demoMode";
import {
  generateSiteContent as realGenerateSiteContent,
  generateReviewReply as realGenerateReviewReply,
  generateSentimentSummary as realGenerateSentimentSummary,
  generateBlogPost as realGenerateBlogPost,
  PROMPT_VERSION,
  BLOG_PROMPT_VERSION,
  type SiteGenerationInput,
  type GeneratedSiteContent,
  type BlogGenerationInput,
  type GeneratedBlogPost,
} from "@/lib/openai";
import {
  mockGenerateSiteContent,
  mockGenerateReviewReply,
  mockGenerateSentimentSummary,
  mockGenerateBlogPost,
} from "@/lib/mockAiContent";

export type { SiteGenerationInput, GeneratedSiteContent, BlogGenerationInput, GeneratedBlogPost };

export async function generateSiteContent(
  input: SiteGenerationInput
): Promise<{ content: GeneratedSiteContent; promptVersion: string }> {
  if (demoFlags.openai) {
    await demoDelay(600, 1100);
    return { content: mockGenerateSiteContent(input), promptVersion: `${PROMPT_VERSION}-demo` };
  }
  return realGenerateSiteContent(input);
}

export async function generateReviewReply(params: {
  clinicName: string;
  authorName: string;
  rating: number;
  text: string | null;
}): Promise<string> {
  if (demoFlags.openai) {
    await demoDelay(500, 900);
    return mockGenerateReviewReply(params);
  }
  return realGenerateReviewReply(params);
}

export async function generateSentimentSummary(reviews: { rating: number; text: string | null }[]): Promise<string> {
  if (demoFlags.openai) {
    await demoDelay(400, 700);
    return mockGenerateSentimentSummary(reviews);
  }
  return realGenerateSentimentSummary(reviews);
}

export async function generateBlogPost(
  input: BlogGenerationInput
): Promise<{ post: GeneratedBlogPost; promptVersion: string }> {
  if (demoFlags.openai) {
    await demoDelay(700, 1200);
    return { post: mockGenerateBlogPost(input), promptVersion: `${BLOG_PROMPT_VERSION}-demo` };
  }
  return { post: await realGenerateBlogPost(input), promptVersion: BLOG_PROMPT_VERSION };
}
