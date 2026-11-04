import { NextRequest, NextResponse } from "next/server";

const APP_BASE_DOMAIN = (process.env.APP_BASE_DOMAIN ?? "localhost").toLowerCase();
export const CLINIC_SLUG_HEADER = "x-clinic-slug";

function isAppHost(hostname: string): boolean {
  return (
    hostname === APP_BASE_DOMAIN ||
    hostname === `www.${APP_BASE_DOMAIN}` ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app")
  );
}

/**
 * Every clinic site renders through /sites/[[...site]]. Three ways in:
 *  - a subdomain:     <slug>.APP_BASE_DOMAIN/...   (needs a wildcard domain)
 *  - a custom domain: lakshmidental.in/...
 *  - a path:          APP_BASE_DOMAIN/s/<slug>/... (works anywhere, e.g. on *.vercel.app,
 *                     which does not allow sub-subdomains)
 * The renderer finds the clinic from the slug header (path) or the Host header.
 */
export function middleware(req: NextRequest) {
  const hostname = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const headers = new Headers(req.headers);
  headers.delete(CLINIC_SLUG_HEADER); // only this middleware may set it

  if (isAppHost(hostname)) {
    const match = req.nextUrl.pathname.match(/^\/s\/([a-z0-9-]+)(\/.*)?$/);
    if (!match) return NextResponse.next({ request: { headers } });
    headers.set(CLINIC_SLUG_HEADER, match[1]);
    const url = req.nextUrl.clone();
    url.pathname = `/sites${match[2] && match[2] !== "/" ? match[2] : ""}`;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const url = req.nextUrl.clone();
  url.pathname = `/sites${req.nextUrl.pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Exclude _next internals, API routes, and any path with a file extension
  // (favicon.ico, /screenshots/*.png, robots.txt, etc.) — static assets must
  // never be rewritten into the per-host clinic-site renderer, and Next's
  // own image optimizer fetches these internally on every request.
  // Each clinic site's own sitemap.xml is the exception.
  matcher: ["/((?!_next|api|.*\\..*).*)", "/sitemap.xml", "/s/:slug/sitemap.xml"],
};
