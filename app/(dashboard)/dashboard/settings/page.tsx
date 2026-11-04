import { NoClinic, PageHeader } from "@/components/app/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SiteSettingsForm from "@/components/SiteSettingsForm";

export default async function SettingsPage() {
  const user = await requireUser();
  if (!user.clinicId) return <NoClinic />;

  const settings = await prisma.siteSettings.findUnique({ where: { clinicId: user.clinicId } });
  if (!settings) return <NoClinic />;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Automations, Google Analytics, Search Console verification and custom scripts for your public site."
      />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SiteSettingsForm
          gaMeasurementId={settings.gaMeasurementId}
          gscVerificationMethod={settings.gscVerificationMethod}
          gscVerificationValue={settings.gscVerificationValue}
          customHeaderScripts={settings.customHeaderScripts}
          customBodyScripts={settings.customBodyScripts}
          blogAutoGenerate={settings.blogAutoGenerate}
          photoRemindersEnabled={settings.photoRemindersEnabled}
        />
      </div>
    </div>
  );
}
