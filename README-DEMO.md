# Frontend-only build — no server, no database, no env vars

This branch (`claude/frontend-only-demo`) is a stripped-down version of the
Clinic Growth OS demo with **everything backend removed**: no Postgres, no
Prisma, no API routes, no auth, no middleware, no env vars at all. It
builds to plain static HTML/CSS/JS (`next build` with `output: "export"`)
and can be deployed to any static host with zero configuration.

Visually and functionally it's the same product: search → animated audit →
growth report, same design system, same demo business data. The only
difference is *where* the work happens — entirely in the browser, with
nothing persisted anywhere.

## What changed vs. the full-stack branch

| | Full-stack (`claude/growth-audit-demo`) | This branch |
|---|---|---|
| Search → score → insights | Server route → Postgres via Prisma | `lib/runAudit.ts`, runs in the browser |
| Result storage | Database row, has a real URL you can revisit | `sessionStorage`, gone on refresh/new tab |
| Auth / dashboard / billing / multi-tenant sites | Real (NextAuth, Razorpay, per-clinic hosting) | Removed — this build is the public audit/report flow only |
| Deploy target | Needs Node hosting + Postgres (Vercel + Neon) | Any static host, no backend at all |

`lib/scoring.ts` and `lib/insights.ts` are untouched — they were always pure
functions with no server dependency, so the exact same scoring algorithm
and insight logic run client-side here.

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — no `.env` file needed, nothing to configure.
Click **"Or see a live example: Lakshmi Dental Care"** to run the full
search → animated audit → report flow.

## Building the static export

```bash
npm run build
```

Output lands in `out/` — plain HTML/CSS/JS. Preview it locally with:

```bash
npx serve out
```

## Deploying

**Vercel:** import the repo, select this branch (`claude/frontend-only-demo`).
Vercel auto-detects `output: "export"` in `next.config.mjs` and deploys it
as a static site — no environment variables needed, no database to set up,
nothing to run migrations against. This is the simplest possible deploy.

**Any other static host** (Netlify, GitHub Pages, Cloudflare Pages, S3 +
CloudFront, ...): run `npm run build`, upload the contents of `out/`.

## Known limitation (by design)

A report's data lives only in that browser tab's `sessionStorage` — refresh
works, but the URL isn't shareable or bookmarkable the way a database-backed
one would be, and a report never expires or needs re-running some fixed
number of times; it's recomputed instantly every time. If you need
shareable report links, persistent accounts, or a dashboard, use the
`claude/growth-audit-demo` branch instead (full-stack, needs Postgres).

## Where the demo data comes from

Same as the full-stack branch: `lib/mockBusinessData.ts` has two curated
business profiles — **Lakshmi Dental Care** (the default quick-start
example) and **Srinivasan Chess Academy** (also searchable) — plus a
deterministic generator for any other query, so the search box never
dead-ends.
