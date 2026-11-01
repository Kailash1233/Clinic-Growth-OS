import { prisma } from "@/lib/prisma";
import { generateClinicSlug } from "@/lib/slug";
import { getPlaceDetails, placePhotoUrl, searchPlaceByText, type PlaceSearchResult } from "@/lib/places";
import { getPageSpeedScores } from "@/lib/pagespeed";
import { checkRobotsAndIndexability, checkConversionReadiness } from "@/lib/siteHealth";
import { computeOverallScore } from "@/lib/scoring";
import { mirrorPlacesPhotoToR2 } from "@/lib/r2";

function formatOpeningHours(hours: unknown): string {
  const weekdayText = (hours as any)?.weekdayDescriptions as string[] | undefined;
  return weekdayText?.join("; ") ?? "Not listed";
}

function extractCity(address: string): string {
  const parts = address.split(",").map((p) => p.trim());
  return parts.length >= 2 ? parts[parts.length - 3] ?? parts[0] : address;
}

async function logUsage(api: "places" | "pagespeed" | "openai", clinicId: string | null, userId: string | null, cost: number) {
  await prisma.generationUsage.create({
    data: { api, clinicId, userId, costEstimate: cost },
  });
}

/** Step 1-2 of the customer journey: search Places, upsert clinic, run health check + score. */
export async function ingestClinicByQuery(query: string, userId: string | null) {
  const results = await searchPlaceByText(query);
  if (results.length === 0) return null;

  const top = results[0];
  return ingestClinicFromPlace(top, userId);
}

export async function ingestClinicFromPlace(place: PlaceSearchResult, userId: string | null) {
  let clinic = await prisma.clinic.findUnique({ where: { googlePlaceId: place.placeId } });

  const photoUrls: string[] = [];
  if (!clinic) {
    for (let i = 0; i < place.photos.length; i++) {
      try {
        const sourceUrl = placePhotoUrl(place.photos[i]);
        const clinicIdForKey = place.placeId; // stable namespace before we have a DB id
        photoUrls.push(await mirrorPlacesPhotoToR2(sourceUrl, clinicIdForKey, i));
      } catch {
        // R2 not configured or fetch failed — non-fatal, demo can still render without photos.
      }
    }
  }

  if (clinic) {
    clinic = await prisma.clinic.update({
      where: { id: clinic.id },
      data: {
        name: place.name,
        address: place.address,
        phone: place.phone,
        category: place.category,
        hours: place.hours as any,
        rating: place.rating,
        reviewCount: place.userRatingCount,
        ...(photoUrls.length ? { photos: photoUrls } : {}),
      },
    });
  } else {
    const slug = await generateClinicSlug(place.name);
    clinic = await prisma.clinic.create({
      data: {
        slug,
        name: place.name,
        address: place.address,
        phone: place.phone,
        category: place.category,
        googlePlaceId: place.placeId,
        hours: place.hours as any,
        rating: place.rating,
        reviewCount: place.userRatingCount,
        photos: photoUrls,
      },
    });
  }

  await logUsage("places", clinic.id, userId, 0.017); // approximate per-call cost, tune from real billing

  const scoreResult = await runHealthCheckAndScore(clinic.id, place.websiteUri, {
    userRatingCount: place.userRatingCount,
    businessStatus: place.businessStatus,
    hasPhotos: photoUrls.length > 0 || (place.photos?.length ?? 0) > 0,
    hasRegularOpeningHours: !!place.hours,
    hasWebsiteUri: !!place.websiteUri,
    rating: place.rating,
  });

  return { clinic, place, ...scoreResult };
}

export async function runHealthCheckAndScore(
  clinicId: string,
  existingSiteUrl: string | null,
  visibility: {
    userRatingCount: number | null;
    businessStatus: string | null;
    hasPhotos: boolean;
    hasRegularOpeningHours: boolean;
    hasWebsiteUri: boolean;
    rating: number | null;
  }
) {
  const hasExistingSite = !!existingSiteUrl;

  let performance: number | null = null;
  let seo: number | null = null;
  let accessibility: number | null = null;
  let isIndexed: boolean | null = null;
  let conversion = {
    hasPhoneLink: false,
    hasBookingMechanism: false,
    hasContactForm: false,
    hasAboveFoldClickToAction: false,
  };

  if (hasExistingSite && existingSiteUrl) {
    try {
      const psi = await getPageSpeedScores(existingSiteUrl);
      performance = psi.performance;
      seo = psi.seo;
      accessibility = psi.accessibility;
      await prisma.generationUsage.create({
        data: { api: "pagespeed", clinicId, costEstimate: 0 },
      });
    } catch {
      // PageSpeed can legitimately fail (site down, blocked) — health score just stays partial.
    }

    try {
      const crawl = await checkRobotsAndIndexability(existingSiteUrl);
      isIndexed = crawl.likelyCrawlable;
    } catch {
      isIndexed = null;
    }

    try {
      conversion = await checkConversionReadiness(existingSiteUrl);
    } catch {
      // leave defaults (all false)
    }
  }

  await prisma.siteHealthCheck.create({
    data: {
      clinicId,
      hasExistingSite,
      existingSiteUrl,
      mobileFriendly: performance != null ? performance >= 0.5 : null,
      loadSpeedScore: performance != null ? Math.round(performance * 100) : null,
      isIndexed,
      conversionChecks: conversion as any,
    },
  });

  const { overall, subScores } = computeOverallScore({
    visibility: {
      userRatingCount: visibility.userRatingCount,
      businessStatus: visibility.businessStatus,
      hasPhotos: visibility.hasPhotos,
      hasRegularOpeningHours: visibility.hasRegularOpeningHours,
      hasWebsiteUri: visibility.hasWebsiteUri,
    },
    siteHealth: { hasExistingSite, performance, seo, accessibility },
    reviews: { rating: visibility.rating, reviewsWithin12moPct: null },
    conversion,
  });

  const score = await prisma.score.create({
    data: {
      clinicId,
      overallScore: overall,
      subScores: subScores as any,
    },
  });

  return { score, subScores };
}

export { formatOpeningHours, extractCity };
