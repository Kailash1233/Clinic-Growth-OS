import { ExternalLink } from "lucide-react";
import { appBaseDomain, siteBaseUrl, siteDisplayHost, usesPathSites } from "@/lib/siteUrl";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DomainConnectForm from "@/components/DomainConnectForm";
import { Card, NoClinic, PageHeader } from "@/components/app/ui";

export default async function DomainPage() {
  const user = await requireUser();
  if (!user.clinicId) return <NoClinic />;

  const settings = await prisma.siteSettings.findUnique({ where: { clinicId: user.clinicId } });
  if (!settings) return <NoClinic />;
  const baseDomain = appBaseDomain();
  const url = siteBaseUrl(settings)!;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Website & domain" description="Where patients find your site, and how to put it on your own domain." />
      <Card title="Your website address">
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 break-all font-mono text-sm font-semibold text-mint-500 hover:underline">
          {siteDisplayHost(settings)} <ExternalLink className="h-4 w-4 shrink-0" />
        </a>
        <p className="mt-2 text-sm text-slate-500">
          {usesPathSites()
            ? "This address always works. Connect your own domain below for a branded address."
            : `This ${baseDomain} address keeps working even after you connect your own domain.`}
        </p>
      </Card>
      <Card title="Connect your own domain" description="Optional. Point a domain you own (e.g. myclinic.in) at your site.">
        <DomainConnectForm currentDomain={settings.customDomain ?? null} verified={settings.domainVerified ?? false} baseDomain={baseDomain} />
      </Card>
    </div>
  );
}
