import { requireEnv } from "@/lib/env";

export function appBaseDomain(): string {
  return requireEnv("APP_BASE_DOMAIN").toLowerCase();
}

/** Scheme and port follow NEXTAUTH_URL, so links work on http://localhost:3000 and https in production. */
function origin(hostname: string): string {
  const app = new URL(requireEnv("NEXTAUTH_URL"));
  return `${app.protocol}//${hostname}${app.port ? `:${app.port}` : ""}`;
}

export function subdomainHost(slug: string): string {
  return `${slug}.${appBaseDomain()}`;
}

/**
 * *.vercel.app can't have sub-subdomains, so there clinic sites live at
 * /s/<slug> on the app itself. On your own domain (with a wildcard DNS
 * record) they get <slug>.yourdomain.
 */
export function usesPathSites(): boolean {
  return appBaseDomain().endsWith(".vercel.app");
}

type Settings = { subdomainSlug: string; customDomain: string | null; domainVerified: boolean };

/** Public URL of a clinic's site: verified custom domain, else subdomain, else /s/<slug>. */
export function siteBaseUrl(settings: Settings | null): string | null {
  if (!settings) return null;
  if (settings.customDomain && settings.domainVerified) return `https://${settings.customDomain}`;
  if (usesPathSites()) return `${requireEnv("NEXTAUTH_URL").replace(/\/$/, "")}/s/${settings.subdomainSlug}`;
  return origin(subdomainHost(settings.subdomainSlug));
}

/** The address of a clinic's site without the scheme — for display. */
export function siteDisplayHost(settings: Settings): string {
  return siteBaseUrl(settings)!.replace(/^https?:\/\//, "");
}
