import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function LeadsPage() {
  const user = await requireUser();
  if (!user.clinicId) return <p className="text-slate-500">No clinic on this account yet.</p>;

  const leads = await prisma.lead.findMany({
    where: { clinicId: user.clinicId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Leads</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-3">{lead.name ?? "—"}</td>
                <td className="px-4 py-3">{lead.phone ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{lead.source.replace(/_/g, " ")}</td>
                <td className="max-w-xs truncate px-4 py-3">{lead.message ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">{lead.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && <p className="p-6 text-center text-slate-400">No leads yet.</p>}
      </div>
    </div>
  );
}
