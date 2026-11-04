import { Building2, CreditCard, Globe, Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminClinicsTable from "@/components/AdminClinicsTable";
import { PageHeader, StatCard } from "@/components/app/ui";

export default async function AdminClinicsPage() {
  await requireAdmin();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [clinics, live, activeSubs, leads] = await Promise.all([
    prisma.clinic.count(),
    prisma.siteSettings.count({ where: { status: "live" } }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.lead.count({ where: { createdAt: { gte: since } } }),
  ]);

  return (
    <>
      <PageHeader title="Clinics" description="Every clinic that has been audited, with its site and subscription status." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clinics audited" value={clinics} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Live sites" value={live} icon={<Globe className="h-4 w-4" />} />
        <StatCard label="Active subscriptions" value={activeSubs} icon={<CreditCard className="h-4 w-4" />} />
        <StatCard label="Leads (30 days)" value={leads} icon={<Inbox className="h-4 w-4" />} />
      </div>
      <AdminClinicsTable />
    </>
  );
}
