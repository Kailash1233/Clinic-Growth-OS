/**
 * Shared shapes, previously mirrored from the real Google Places API client
 * (now removed — this build has no backend at all). Kept identical so
 * lib/mockBusinessData.ts, lib/scoring.ts and lib/insights.ts don't need to
 * know anything changed.
 */

export type PlaceSearchResult = {
  placeId: string;
  name: string;
  address: string;
  category: string | null;
  phone: string | null;
  websiteUri: string | null;
  rating: number | null;
  userRatingCount: number | null;
  businessStatus: string | null;
  hours: unknown;
  photos: string[];
  editorialSummary: string | null;
};

export type PlaceReview = {
  googleReviewId: string;
  authorName: string;
  rating: number;
  text: string | null;
  reviewTime: Date;
};
