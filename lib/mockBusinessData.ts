import type { PlaceSearchResult } from "@/lib/places";
import type { PlaceReview } from "@/lib/places";

/**
 * Demo-mode data: a curated, realistic business profile ("Srinivasan Chess
 * Academy") plus a deterministic generator for any other query, so the
 * search box never dead-ends in a demo. Shaped identically to the real
 * Places API types (PlaceSearchResult / PlaceReview) so nothing downstream
 * — scoring, health checks, the renderer — knows or cares that it's mocked.
 */

const FEATURED_NAME = "Srinivasan Chess Academy";
const FEATURED_SLUG = normalize(FEATURED_NAME);

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function isFeaturedQuery(query: string): boolean {
  const q = normalize(query);
  return q.includes("srinivasan") || q.includes("chess academy") || q === FEATURED_SLUG;
}

const FEATURED_PROFILE: PlaceSearchResult = {
  placeId: "demo-place-srinivasan-chess-academy",
  name: "Srinivasan Chess Academy",
  address: "23 Gandhi Road, T. Nagar, Chennai, Tamil Nadu 600017",
  category: "Chess Instructor",
  phone: "+914412345678",
  websiteUri: null,
  rating: 4.3,
  userRatingCount: 37,
  businessStatus: "OPERATIONAL",
  hours: {
    weekdayDescriptions: [
      "Monday: 4:00 – 8:00 PM",
      "Tuesday: 4:00 – 8:00 PM",
      "Wednesday: 4:00 – 8:00 PM",
      "Thursday: 4:00 – 8:00 PM",
      "Friday: 4:00 – 8:00 PM",
      "Saturday: 10:00 AM – 1:00 PM, 4:00 – 8:00 PM",
      "Sunday: 10:00 AM – 1:00 PM",
    ],
  },
  photos: [],
  editorialSummary: null,
};

const FEATURED_REVIEWS: PlaceReview[] = [
  {
    googleReviewId: "demo-review-chess-1",
    authorName: "Rajesh Kumar",
    rating: 5,
    text: "My son has improved so much since joining. Srinivasan sir is very patient and explains concepts clearly, even to beginners.",
    reviewTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
  {
    googleReviewId: "demo-review-chess-2",
    authorName: "Deepa Iyer",
    rating: 4,
    text: "Great coaching for beginners and intermediate players. Only wish they had a website — I always have to call to check batch timings.",
    reviewTime: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
  },
  {
    googleReviewId: "demo-review-chess-3",
    authorName: "Arun Prakash",
    rating: 5,
    text: "Best chess academy in T. Nagar. My daughter won her first district tournament after 6 months of classes here.",
    reviewTime: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
  },
  {
    googleReviewId: "demo-review-chess-4",
    authorName: "Meena Raghavan",
    rating: 3,
    text: "Good teaching but hard to find information online before joining — had to ask a friend for the address and fees.",
    reviewTime: new Date(Date.now() - 41 * 24 * 60 * 60 * 1000),
  },
];

const CATEGORIES = [
  "Dental Clinic",
  "Yoga Studio",
  "Physiotherapy Clinic",
  "Tuition Center",
  "Salon",
  "Gym",
  "Veterinary Clinic",
  "Driving School",
];

const CITY_AREAS = [
  ["Koramangala", "Bengaluru", "Karnataka", "560034"],
  ["Andheri West", "Mumbai", "Maharashtra", "400058"],
  ["Rajouri Garden", "New Delhi", "Delhi", "110027"],
  ["T. Nagar", "Chennai", "Tamil Nadu", "600017"],
  ["Banjara Hills", "Hyderabad", "Telangana", "500034"],
];

const FIRST_NAMES = ["Priya", "Rahul", "Anita", "Vikram", "Sneha", "Arjun", "Kavya", "Rohan"];
const LAST_NAMES = ["Sharma", "Nair", "Reddy", "Gupta", "Menon", "Iyer", "Patel", "Singh"];

/** Deterministic pseudo-random generator so the same query always yields the same demo profile. */
function makeRng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function genericProfile(query: string): PlaceSearchResult {
  const seed = hashString(normalize(query));
  const rand = makeRng(seed);
  const name = query.trim().replace(/\s+/g, " ") || "Local Business";
  const category = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
  const [area, city, state, pin] = CITY_AREAS[Math.floor(rand() * CITY_AREAS.length)];
  const rating = Math.round((3.4 + rand() * 1.4) * 10) / 10;
  const userRatingCount = Math.round(4 + rand() * 140);

  return {
    placeId: `demo-place-${seed}`,
    name,
    address: `${Math.ceil(rand() * 98) + 1} ${area} Main Road, ${area}, ${city}, ${state} ${pin}`,
    category,
    phone: `+91${Math.floor(7000000000 + rand() * 2999999999)}`,
    websiteUri: null, // demo profiles never have a site — that's the hook
    rating,
    userRatingCount,
    businessStatus: "OPERATIONAL",
    hours: {
      weekdayDescriptions: [
        "Monday: 10:00 AM – 7:00 PM",
        "Tuesday: 10:00 AM – 7:00 PM",
        "Wednesday: 10:00 AM – 7:00 PM",
        "Thursday: 10:00 AM – 7:00 PM",
        "Friday: 10:00 AM – 7:00 PM",
        "Saturday: 10:00 AM – 5:00 PM",
        rand() > 0.5 ? "Sunday: Closed" : "Sunday: 11:00 AM – 3:00 PM",
      ],
    },
    photos: [],
    editorialSummary: null,
  };
}

function genericReviews(query: string, profile: PlaceSearchResult): PlaceReview[] {
  const seed = hashString(normalize(query)) + 1;
  const rand = makeRng(seed);
  const count = 3 + Math.floor(rand() * 2);
  const templates = [
    "Really happy with the service here, staff are friendly and professional.",
    "Good experience overall. Wish it was easier to find details online before visiting.",
    "Been coming here for months now, consistently good quality.",
    "Had to call twice to confirm timings since there's no website — otherwise great.",
    "Friendly team, would recommend to anyone nearby.",
  ];

  return Array.from({ length: count }, (_, i) => {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const rating = Math.max(3, Math.min(5, Math.round(profile.rating ?? 4) + (rand() > 0.7 ? -1 : 0)));
    return {
      googleReviewId: `demo-review-${hashString(normalize(query))}-${i}`,
      authorName: `${first} ${last}`,
      rating,
      text: templates[Math.floor(rand() * templates.length)],
      reviewTime: new Date(Date.now() - (5 + i * 11) * 24 * 60 * 60 * 1000),
    };
  });
}

export function mockSearchPlaceByText(query: string): PlaceSearchResult[] {
  if (isFeaturedQuery(query)) return [FEATURED_PROFILE];
  return [genericProfile(query)];
}

export function mockGetPlaceDetails(placeId: string): PlaceSearchResult {
  if (placeId === FEATURED_PROFILE.placeId) return FEATURED_PROFILE;
  return genericProfile(placeId.replace(/^demo-place-/, ""));
}

export function mockGetPlaceReviews(placeId: string): PlaceReview[] {
  if (placeId === FEATURED_PROFILE.placeId) return FEATURED_REVIEWS;
  return genericReviews(placeId, genericProfile(placeId));
}

export { FEATURED_NAME };
