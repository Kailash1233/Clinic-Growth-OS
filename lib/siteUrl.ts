/** Public URL of a clinic's site: verified custom domain if any, otherwise its subdomain. */
export function siteBaseUrl(
  settings: { subdomainSlug: string; customDomain: string | null; domainVerified: boolean } | null
): string | null {
  if (!settings) return null;
  if (settings.customDomain && settings.domainVerified) return `https://${settings.customDomain}`;
  return `https://${settings.subdomainSlug}.${process.env.APP_BASE_DOMAIN ?? "yourbrand.in"}`;
}
