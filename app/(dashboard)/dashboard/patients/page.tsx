import { NoClinic, PageHeader } from "@/components/app/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PatientsTable from "@/components/PatientsTable";

export default async function PatientsPage() {
  const user = await requireUser();
  if (!user.clinicId) return <NoClinic />;

  const patients = await prisma.patient.findMany({
    where: { clinicId: user.clinicId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Leads you've converted into patients. Update the last visit date to see who's due for a follow-up."
      />
      <div>
        <PatientsTable
          initialPatients={patients.map((p) => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            lastVisitDate: p.lastVisitDate ? p.lastVisitDate.toISOString() : null,
            notes: p.notes,
          }))}
        />
      </div>
      <p className="mt-4 text-sm text-slate-400">
        Convert a lead into a patient from the <a href="/dashboard/leads" className="underline">Leads</a> page.
      </p>
    </div>
  );
}
