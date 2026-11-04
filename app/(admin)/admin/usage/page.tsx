import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, PageHeader, StatCard, Table, Td, Th } from "@/components/app/ui";

const LABEL: Record<string, string> = { places: "Google Places", pagespeed: "PageSpeed", groq: "Groq AI" };

export default async function AdminUsagePage() {
  await requireAdmin();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [usage, grouped] = await Promise.all([
    prisma.generationUsage.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { clinic: { select: { name: true } } } }),
    prisma.generationUsage.groupBy({ by: ["api"], where: { createdAt: { gte: since } }, _count: true, _sum: { costEstimate: true } }),
  ]);

  return (
    <>
      <PageHeader title="API usage" description="Calls to paid and rate-limited services over the last 30 days, and the latest 200 calls." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {(["places", "pagespeed", "groq"] as const).map((api) => {
          const row = grouped.find((g) => g.api === api);
          return (
            <StatCard key={api} label={LABEL[api]} value={row?._count ?? 0} hint={`calls · est. $${(row?._sum.costEstimate ?? 0).toFixed(2)}`} />
          );
        })}
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Service</Th>
            <Th>Clinic</Th>
            <Th>Cost est.</Th>
            <Th>When</Th>
          </tr>
        </thead>
        <tbody>
          {usage.map((row) => (
            <tr key={row.id}>
              <Td>
                <Badge tone="blue">{LABEL[row.api] ?? row.api}</Badge>
              </Td>
              <Td>{row.clinic?.name ?? "—"}</Td>
              <Td>${row.costEstimate.toFixed(3)}</Td>
              <Td className="text-slate-500">{row.createdAt.toLocaleString("en-IN")}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
