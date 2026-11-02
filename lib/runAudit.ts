import { mockSearchPlaceByText, mockGetPlaceReviews } from "@/lib/mockBusinessData";
import { computeOverallScore, type SubScores } from "@/lib/scoring";
import { generateInsights, type Insight } from "@/lib/insights";
import type { PlaceSearchResult, PlaceReview } from "@/lib/types";

export type AuditResult = {
  place: PlaceSearchResult;
  reviews: PlaceReview[];
  score: { overall: number; subScores: SubScores };
  insights: Insight[];
};

/**
 * The entire search -> score -> insights pipeline, run client-side. This is
 * the frontend-only replacement for what used to be a server route
 * (POST /api/clinics/search) backed by Postgres — there's no persistence
 * here at all, just a pure computation over the mock business data.
 *
 * Every demo profile currently has no existing website, so siteHealth is
 * always 0 and conversion readiness is always 0 — matches the backed
 * version exactly, since that's also what it computed (a real PageSpeed/
 * site-crawl check never had anything to check against in demo mode).
 */
export function runAudit(query: string): AuditResult | null {
  const results = mockSearchPlaceByText(query);
  if (results.length === 0) return null;

  const place = results[0];
  const reviews = mockGetPlaceReviews(place.placeId);
  const hasExistingSite = !!place.websiteUri;
  const hasPhotos = place.photos.length > 0;

  const conversion = {
    hasPhoneLink: false,
    hasBookingMechanism: false,
    hasContactForm: false,
    hasAboveFoldClickToAction: false,
  };

  const { overall, subScores } = computeOverallScore({
    visibility: {
      userRatingCount: place.userRatingCount,
      businessStatus: place.businessStatus,
      hasPhotos,
      hasRegularOpeningHours: !!place.hours,
      hasWebsiteUri: hasExistingSite,
    },
    siteHealth: { hasExistingSite, performance: null, seo: null, accessibility: null },
    reviews: { rating: place.rating, reviewsWithin12moPct: null },
    conversion,
  });

  const insights = generateInsights({
    category: place.category,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    hasPhotos,
    hasExistingSite,
    conversion,
  });

  return { place, reviews, score: { overall, subScores }, insights };
}
