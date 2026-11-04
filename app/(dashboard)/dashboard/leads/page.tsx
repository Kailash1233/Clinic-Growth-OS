import { NoClinic, PageHeader } from "@/components/app/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeadsTable from "@/components/LeadsTable";

export default async function LeadsPage() {
  const user = await requireUser();
  if (!user.clinicId) return <NoClinic />;

  const leads = await prisma.lead.findMany({
    where: { clinicId: user.clinicId },
    orderBy: { createdAt: "desc" },
    include: { patient: true },
  });

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Every patient enquiry from your website: contact-form messages, Call taps and WhatsApp taps. Convert a lead into a patient once they book."
      />
      <div>
        <LeadsTable
          initialLeads={leads.map((lead) => ({
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            source: lead.source,
            message: lead.message,
            createdAt: lead.createdAt.toISOString(),
            isPatient: !!lead.patient,
          }))}
        />
      </div>
    </div>
  );
}
