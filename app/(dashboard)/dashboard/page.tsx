import Link from "next/link";
import { ArrowUpRight, Download, ExternalLink, FileText, Gauge, Globe, Inbox, Search, Sparkles, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteBaseUrl, siteDisplayHost } from "@/lib/siteUrl";
import { buildGrowthReport } from "@/lib/report";
import { Badge, Card, EmptyState, PageHeader, ProgressBar, ScoreRing, StatCard, Table, Td, Th, buttonStyles, statusTone } from "@/components/app/ui";

const SOURCE_LABEL: Record<string, string> = { contact_form: "Contact form", click_to_call: "Call tap", whatsapp: "WhatsApp tap" };

export default async function DashboardOverviewPage() {
  const user = await requireUser();

  if (!user.clinicId) {
    return (
      <>
        <PageHeader title="Welcome to Clinic Growth" description="Let's set up your clinic." />
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Find your clinic to get started"
          description="Search your clinic by name on the home page. You'll get a free Growth Score, then generate your website from the report."
          action={
            <Link href="/" className={buttonStyles.primary}>
              Search my clinic
            </Link>
          }
        />
      </>
    );
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [clinic, leads30, reviewCount, pendingPosts, report] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: user.clinicId },
      include: {
        siteSettings: true,
        siteContent: { select: { id: true } },
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
        leads: { orderBy: { createdAt: "desc" }, take: 6 },
      },
    }),
    prisma.lead.count({ where: { clinicId: user.clinicId, createdAt: { gte: since } } }),
    prisma.review.count({ where: { clinicId: user.clinicId } }),
    prisma.blogPost.count({ where: { clinicId: user.clinicId, status: "pending_approval" } }),
    buildGrowthReport(user.clinicId),
  ]);
  if (!clinic) return null;

  const subscription = clinic.subscriptions[0];
  const isLive = subscription?.status === "active";
  const siteUrl = siteBaseUrl(clinic.siteSettings);

  return (
    <>
      <PageHeader
        title={clinic.name}
        description={clinic.address}
        actions={
          <>
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noreferrer" className={buttonStyles.secondary}>
                <ExternalLink className="h-4 w-4" /> View website
              </a>
            )}
            <a href={`/api/clinics/${clinic.id}/report`} className={buttonStyles.secondary}>
              <Download className="h-4 w-4" /> Growth report
            </a>
            {!isLive && (
              <Link href="/dashboard/billing" className={buttonStyles.primary}>
                <Sparkles className="h-4 w-4" /> Go live
              </Link>
            )}
          </>
        }
      />

      {pendingPosts > 0 && (
        <Link
          href="/dashboard/blog"
          className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 transition hover:bg-amber-100"
        >
          <span className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            {pendingPosts === 1 ? "1 blog post is" : `${pendingPosts} blog posts are`} waiting for your approval.
          </span>
          <span className="font-semibold">Review →</span>
        </Link>
      )}

      {!clinic.siteContent && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-mint-100 bg-mint-50 px-5 py-4 text-sm text-mint-900 sm:flex-row sm:items-center sm:justify-between">
          <span>Your website hasn&apos;t been generated yet.</span>
          <Link href={`/clinic/${clinic.id}`} className={buttonStyles.primary}>
            Generate my website
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Growth score" icon={<Gauge className="h-4 w-4" />} value={report ? `${report.overall}/100` : "—"} hint={report?.band.label} />
        <StatCard label="Leads (30 days)" icon={<Inbox className="h-4 w-4" />} value={leads30} hint={<Link href="/dashboard/leads" className="hover:underline">View inbox →</Link>} />
        <StatCard label="Google reviews" icon={<Star className="h-4 w-4" />} value={clinic.rating ? `${clinic.rating.toFixed(1)} ★` : "—"} hint={`${clinic.reviewCount ?? 0} on Google · ${reviewCount} synced`} />
        <StatCard
          label="Website"
          icon={<Globe className="h-4 w-4" />}
          value={<Badge tone={statusTone(clinic.siteSettings?.status)}>{clinic.siteSettings?.status ?? "not created"}</Badge>}
          hint={isLive ? `${subscription?.planTier} plan · active` : "Preview — not live yet"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          title="Growth score"
          description="How patients find and contact you, from your latest scan."
          className="lg:col-span-2"
          action={
            <Link href={`/clinic/${clinic.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-mint-500 hover:underline">
              Full report <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {report ? (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <ScoreRing score={report.overall} />
              <div className="flex-1 space-y-4">
                {report.factors.map((f) => (
                  <div key={f.key}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{f.label}</span>
                      <span className="font-semibold text-slate-900">{f.score}</span>
                    </div>
                    <ProgressBar value={f.score} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No scan yet.</p>
          )}
        </Card>

        <Card title="Top actions" description="Biggest score gains first.">
          {report?.topActions.length ? (
            <ol className="space-y-3">
              {report.topActions.slice(0, 4).map((a, i) => (
                <li key={a} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-50 text-xs font-bold text-mint-500">{i + 1}</span>
                  {a}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-500">Nothing urgent. Nice work.</p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent leads</h2>
            <Link href="/dashboard/leads" className="text-xs font-semibold text-mint-500 hover:underline">
              View all →
            </Link>
          </div>
          {clinic.leads.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No leads yet"
              description="Leads appear here when a patient fills in your website's contact form or taps Call or WhatsApp."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Source</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody>
                {clinic.leads.map((lead) => (
                  <tr key={lead.id}>
                    <Td className="font-medium text-slate-900">{lead.name ?? "—"}</Td>
                    <Td>{lead.phone ?? "—"}</Td>
                    <Td>
                      <Badge tone="blue">{SOURCE_LABEL[lead.source] ?? lead.source}</Badge>
                    </Td>
                    <Td className="text-slate-500">{lead.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <Card title="Your website">
          {clinic.siteSettings && siteUrl ? (
            <div className="space-y-4 text-sm">
              <a href={siteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 break-all font-semibold text-mint-500 hover:underline">
                <Globe className="h-4 w-4 shrink-0" /> {siteDisplayHost(clinic.siteSettings)}
              </a>
              <p className="text-slate-500">
                {isLive ? "Live for patients. Leads from the site land in your inbox." : "Preview mode: visitors see a preview banner until you choose a plan."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/domain" className={buttonStyles.secondary}>
                  Connect domain
                </Link>
                {!isLive && (
                  <Link href="/dashboard/billing" className={buttonStyles.primary}>
                    Choose a plan
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Generate your website from your Growth Report to see it here.</p>
          )}
        </Card>
      </div>
    </>
  );
}
