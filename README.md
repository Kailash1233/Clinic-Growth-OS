# Clinic Growth OS

Self-serve SaaS for clinics in India: search a clinic → instant Google-Places-based
growth score → AI-generated demo website → Razorpay checkout → live hosted site on a
subdomain or custom domain. Full spec in [`docs/requirements.md`](docs/requirements.md);
the OpenAI prompt template lives at [`prompts/site-generation.md`](prompts/site-generation.md).

**v2 additions** (per `v2-features.md`): reputation management (review inbox +
AI-drafted replies + sentiment, `/dashboard/reviews`) and minimal patient retention
(`/dashboard/patients`) — both reuse existing API keys, nothing new required. Social
media automation from that doc is intentionally not built yet (phase 3, per its own
build-order note). The marketing home page is the `landing-page-v2-prompt.md` rebuild.

## Stack

Next.js (App Router) · PostgreSQL + Prisma · Auth.js (OTP) · OpenAI structured outputs ·
Razorpay Subscriptions · Cloudflare R2 · Caddy (on-demand TLS) · Cloudflare Turnstile.

## Project structure

```
/app
  /(marketing)        public search, clinic score/demo page, login (OTP)
  /(dashboard)         owner dashboard — overview, leads, domain, settings
  /(admin)             agency/admin panel — clinics, API usage, prompt editor
  /sites               shared clinic site renderer, resolved by Host header
  /api                 all backend routes (see docs/requirements.md §13)
/lib                   places, pagespeed, siteHealth, scoring, openai, razorpay, r2, auth, otp
/prisma/schema.prisma  data model (requirements.md §4)
/prompts/site-generation.md   editable without a deploy — see Admin > Prompt template
/docs/Caddyfile        reverse proxy + on-demand TLS config for custom domains
```

`app/(marketing)`, `app/(dashboard)`, `app/(admin)`, and `app/sites` are each independent
Next.js root layouts (the "multiple root layouts" pattern) — `sites` needs its own because
it renders a completely different `<head>`/`<body>` per clinic hostname, resolved at request
time via `lib/resolveSiteByHost.ts`. `middleware.ts` routes any hostname that isn't the app's
own domain into `/sites`.

## Local setup

1. `cp .env.example .env` and fill in values (see "API keys required" below — everything
   can be left blank to run the app and explore the UI; features that call a given API will
   error until its key is set).
2. `npm install`
3. Start Postgres (e.g. `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`)
   and point `DATABASE_URL` at it.
4. `npm run prisma:migrate` — creates the schema.
5. `npm run db:seed` — creates an admin user (`SEED_ADMIN_EMAIL`, defaults to
   `admin@example.com`). Sign in via `/login` with that email; without `RESEND_API_KEY` set,
   the OTP code is printed to the server console instead of emailed.
6. `npm run dev` → http://localhost:3000

## Deploying (per requirements.md §2, §8)

- VPS (Hetzner/DigitalOcean), Node process managed by systemd or pm2, Caddy in front —
  see `docs/Caddyfile`. Point wildcard DNS (`*.yourbrand.in`) and your registrar's A/AAAA
  records at the VPS.
- `npm run build && npm run prisma:deploy && npm start`.
- Swap every `yourbrand.in` placeholder (Caddyfile, `APP_BASE_DOMAIN`) for the real domain
  once it's picked (requirements §15) — nothing else in the architecture depends on the name.
- Set a **daily quota cap** on the Google Places/PageSpeed keys and a **monthly spend cap**
  on the OpenAI key in their respective consoles before going live — the app enforces
  account-level and IP-level rate limits (`lib/rateLimit.ts`), but the hard caps are the
  backstop (requirements §10).

## API keys required

None of these are needed to browse the UI — only to exercise the feature that calls them.
Nothing is hardcoded or requested inside the app itself; everything is read from `.env` /
your deployment platform's environment variables.

| Variable | Used for | Get it from |
|---|---|---|
| `DATABASE_URL` | Postgres connection | Your Postgres host (self-hosted or managed) |
| `NEXTAUTH_SECRET` | Session signing | `openssl rand -base64 32` |
| `GOOGLE_PLACES_API_KEY` | Clinic search, profile data | Google Cloud Console → enable "Places API (New)" |
| `GOOGLE_PAGESPEED_API_KEY` | Site-health scoring | Google Cloud Console → enable "PageSpeed Insights API" |
| `OPENAI_API_KEY` | AI demo site generation | platform.openai.com |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Checkout, subscriptions | Razorpay Dashboard → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Verifying billing webhooks | Razorpay Dashboard → Webhooks (set URL to `/api/webhooks/razorpay`) |
| `RAZORPAY_PLAN_STARTER` / `RAZORPAY_PLAN_GROWTH` | Plan IDs for checkout | Razorpay Dashboard → Subscriptions → Plans |
| `CLOUDFLARE_R2_*` | Clinic photo storage | Cloudflare dashboard → R2 |
| `CLOUDFLARE_TURNSTILE_*` | Bot protection on search/signup | Cloudflare dashboard → Turnstile |
| `OTP_PROVIDER_API_KEY` (+ `MSG91_TEMPLATE_ID`) | SMS OTP | MSG91 (or swap `lib/otp.ts` for Twilio Verify) |
| `RESEND_API_KEY` | Email OTP fallback, receipts | resend.com |
| `APP_BASE_DOMAIN` | Subdomain hosting (`{slug}.<this>`) | Your chosen brand domain |
| `NEXT_PUBLIC_HERO_BADGE_TEXT` *(optional)* | Landing page hero pill text | Your own honest copy — defaults to "Built for Indian clinics" |
| `PARTNER_LOGOS` *(optional)* | Landing page trust-banner logos | Comma-separated names; row stays hidden until set |

See `.env.example` for the full list with inline notes.
