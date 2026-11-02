# This is a demo build — here's how it works

This copy of the app runs **entirely without real API keys**. Every external
integration (Google Places, Google PageSpeed Insights, OpenAI) is swapped
for realistic mock data automatically, with zero code changes required to
go live later.

## How the demo mode works

Each integration has one "provider" file that every route/page imports from.
The provider checks whether the matching env var is set and silently
branches:

| Integration | Provider (always import this) | Real implementation | Mock implementation | Switched on |
|---|---|---|---|---|
| Google Places | `lib/placesProvider.ts` | `lib/places.ts` | `lib/mockBusinessData.ts` | `GOOGLE_PLACES_API_KEY` |
| Google PageSpeed | used inside `lib/clinicIngest.ts` | `lib/pagespeed.ts` | skipped (demo profiles never have a site) | `GOOGLE_PAGESPEED_API_KEY` |
| OpenAI (site copy, review replies, sentiment) | `lib/aiProvider.ts` | `lib/openai.ts` | `lib/mockAiContent.ts` | `OPENAI_API_KEY` |
| Cloudflare Turnstile | `components/TurnstileWidget.tsx` + `lib/turnstile.ts` | real Turnstile widget/verify | pass-through (always verifies) | `CLOUDFLARE_TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| Razorpay | `components/CheckoutButton.tsx` + `app/api/checkout` | real checkout | — not mocked; button will error without keys | `RAZORPAY_KEY_ID` etc. |

The logic lives in `lib/demoMode.ts`:

```ts
export const demoFlags = {
  places: !process.env.GOOGLE_PLACES_API_KEY,
  pagespeed: !process.env.GOOGLE_PAGESPEED_API_KEY,
  openai: !process.env.OPENAI_API_KEY,
};
```

**To go live, you don't touch any code.** Just add the real key(s) to
`.env` (or your hosting provider's environment variables) and redeploy —
the provider for that integration will automatically start calling the
real API instead of the mock one. You can flip integrations on one at a
time; the app works correctly in any mixed state (e.g. real Places data
with mock AI copy).

## What's curated vs. generated

- Searching **"Srinivasan Chess Academy"** (or using the "see a live
  example" quick-start link on the homepage) always returns the same
  curated, realistic business profile and reviews — defined in
  `lib/mockBusinessData.ts` (`FEATURED_PROFILE` / `FEATURED_REVIEWS`). This
  is the one to show off in a demo.
- Searching anything else deterministically generates a plausible business
  (same query → same result every time, via a seeded PRNG) so the product
  still feels real for arbitrary input, just not hand-curated.
- All mock businesses have no existing website, which is what drives the
  "No website found" / "No way to book online" insights and the
  "generate a demo site" CTA — the core sales narrative of the product.

## API keys needed for a full production deployment

| Variable | Used for |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `NEXTAUTH_SECRET` | Session signing (`openssl rand -base64 32`) |
| `GOOGLE_PLACES_API_KEY` | Real business search/profile data |
| `GOOGLE_PAGESPEED_API_KEY` | Real site health / performance scoring |
| `OPENAI_API_KEY` | Real AI-generated site copy, review replies, sentiment |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` / `RAZORPAY_PLAN_STARTER` / `RAZORPAY_PLAN_GROWTH` | Billing |
| `CLOUDFLARE_R2_*` | Review photo storage |
| `CLOUDFLARE_TURNSTILE_SITE_KEY` / `SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Bot protection on the public search form |

## Running this demo locally

```bash
npm install
cp .env.example .env   # already pre-filled as a working demo .env in this copy
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Then open `http://localhost:3000` and click **"Or see a live example:
Srinivasan Chess Academy"**.
