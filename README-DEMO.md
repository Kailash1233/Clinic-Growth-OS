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

- Searching **"Lakshmi Dental Care"** (or using the "see a live example"
  quick-start link on the homepage) always returns the same curated,
  realistic clinic profile and reviews — a dental clinic on Usman Road,
  T. Nagar, Chennai, defined in `lib/mockBusinessData.ts`
  (`CLINIC_PROFILE` / `CLINIC_REVIEWS`). This is the one to show off in a
  demo, since the product itself is a clinic growth tool.
- Searching **"Srinivasan Chess Academy"** also works and returns a second
  curated profile (`CHESS_PROFILE` / `CHESS_REVIEWS`), a few streets away
  in the same T. Nagar neighborhood — kept to show the product reads
  sensibly outside strictly medical clinics too, but it's not the default.
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
Lakshmi Dental Care"**.

## Deploying to Vercel

This app is already Vercel-ready — `middleware.ts` recognizes `*.vercel.app`
hosts out of the box, the build script (`prisma generate && next build`)
is exactly what Vercel runs by default, and there's no filesystem writes
anywhere that would break on a serverless runtime.

Vercel doesn't include a database, so you need a hosted Postgres. The
[Neon](https://neon.tech) free tier is the fastest path (a few minutes,
no credit card):

1. **Create the database.** Sign up at neon.tech, create a project, and
   copy its connection string (starts with `postgresql://...`).
2. **Run migrations against it once, from your own machine** (Vercel does
   not run migrations automatically on deploy):
   ```bash
   DATABASE_URL="<your neon connection string>" npx prisma migrate deploy
   DATABASE_URL="<your neon connection string>" npm run db:seed
   ```
3. **Import the repo into Vercel**: vercel.com → Add New → Project → pick
   this GitHub repo → select the `claude/growth-audit-demo` branch.
4. **Set these environment variables** in the Vercel project settings
   (Settings → Environment Variables) before the first deploy:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | your Neon connection string |
   | `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://<your-project>.vercel.app` |
   | `APP_BASE_DOMAIN` | `<your-project>.vercel.app` (or a custom domain once you connect one) |

   Leave every API-key variable (`GOOGLE_PLACES_API_KEY`,
   `OPENAI_API_KEY`, `CLOUDFLARE_TURNSTILE_*`, `RAZORPAY_*`, etc.) **unset**
   — demo mode activates automatically, exactly like it does locally.
5. **Deploy.** Vercel builds and serves it; open the deployed URL and the
   same search → animated audit → report flow works, backed by your Neon
   database instead of local Postgres.

To go live later, add the real API keys as additional environment
variables and redeploy — no code changes, per the table above.

## SEO blog posts and weekly Google photo reminders

### What it does

- **Weekly SEO blog drafts.** For each clinic with an active subscription,
  the app builds location-based keywords from the clinic's own category,
  services and address (e.g. "dental clinic in T. Nagar", "root canal
  treatment cost in Chennai"). It then pulls the questions people actually
  type into Google from Google's public autocomplete (free, no API key),
  and has OpenAI draft a post that targets one unused keyword and answers
  those questions. Drafts follow the same rules as the site copy: no
  medical advice, no prices, no outcome claims, no invented facts.
- **Owner approval is mandatory.** Every draft is saved as
  `pending_approval` and the owner gets an email. They review it under
  **Dashboard → Blog**, where they can edit, **Approve & publish**, or
  **Reject** it. Public pages only ever read `published` posts, so nothing
  reaches `/blog` or `sitemap.xml` without approval. A published post can be
  unpublished at any time.
- **Public blog on each clinic site:** `/blog`, `/blog/<slug>` (with
  `BlogPosting` + `FAQPage` structured data), a "Latest articles" block on
  the homepage, and a per-clinic `/sitemap.xml`.
- **Weekly photo reminder.** Each owner gets one email a week reminding
  them to upload new photos to their Google Business Profile, with photo
  ideas and how-to steps. Owners with only a phone number get an SMS instead,
  if you configure an MSG91 template.
- Owners can turn either automation off in **Dashboard → Settings**.

If Google's autocomplete can't be reached, drafts fall back to generic
question templates. Those drafts get a **"Generic questions"** badge
instead of **"Based on real Google searches"**, so the owner always knows
which kind they're approving.

### Setup

1. Run the new migration: `npx prisma migrate deploy`.
2. Set `CRON_SECRET` (any long random string). For real emails, also set
   `RESEND_API_KEY` and `EMAIL_FROM`. For real AI writing, set
   `OPENAI_API_KEY`.
3. Schedule the two jobs:
   - **Vercel:** nothing to do. `vercel.json` already registers both jobs
     to run daily, and Vercel sends the `CRON_SECRET` header automatically.
   - **VPS:** add to crontab (times are UTC, i.e. 9:00 and 10:00 IST):
     ```
     30 3 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://yourbrand.in/api/cron/blog-drafts
     30 4 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://yourbrand.in/api/cron/photo-reminders
     ```

The jobs run daily but are rate-limited inside: at most one new draft per
clinic per 7 days (skipped while a draft is still awaiting review), and one
photo reminder per owner per week. Re-running a job never double-sends.
Every send attempt, including failures, is recorded in `notification_log`.
