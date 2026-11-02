/**
 * The one place every caller should import Places data from. Real vs. mock
 * is decided here, once, by whether GOOGLE_PLACES_API_KEY is set — add the
 * key to `.env` and every caller switches to the real API automatically,
 * no code changes anywhere else. See lib/demoMode.ts.
 */
import { demoFlags, demoDelay } from "@/lib/demoMode";
import {
  searchPlaceByText as realSearch,
  getPlaceDetails as realDetails,
  getPlaceReviews as realReviews,
  type PlaceSearchResult,
  type PlaceReview,
} from "@/lib/places";
import { mockSearchPlaceByText, mockGetPlaceDetails, mockGetPlaceReviews } from "@/lib/mockBusinessData";

export type { PlaceSearchResult, PlaceReview };

export async function searchPlaceByText(query: string): Promise<PlaceSearchResult[]> {
  if (demoFlags.places) {
    await demoDelay();
    return mockSearchPlaceByText(query);
  }
  return realSearch(query);
}

export async function getPlaceDetails(placeId: string): Promise<PlaceSearchResult> {
  if (demoFlags.places) {
    await demoDelay(200, 400);
    return mockGetPlaceDetails(placeId);
  }
  return realDetails(placeId);
}

export async function getPlaceReviews(placeId: string): Promise<PlaceReview[]> {
  if (demoFlags.places) {
    await demoDelay(300, 600);
    return mockGetPlaceReviews(placeId);
  }
  return realReviews(placeId);
}
