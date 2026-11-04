import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/app/globals.css";
import { displayFont } from "@/lib/fonts";
import SessionProvider from "@/components/providers/SessionProvider";
import SidebarNav, { type NavItem } from "@/components/app/SidebarNav";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login?next=/dashboard");

  const clinic = session.user.clinicId
    ? await prisma.clinic.findUnique({
        where: { id: session.user.clinicId },
        select: {
          name: true,
          subscriptions: { where: { status: "active" }, take: 1, select: { planTier: true } },
          _count: { select: { blogPosts: { where: { status: "pending_approval" } } } },
        },
      })
    : null;
  const plan = clinic?.subscriptions[0]?.planTier ?? null;

  const items: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "overview" },
    { href: "/dashboard/leads", label: "Leads", icon: "leads" },
    { href: "/dashboard/patients", label: "Patients", icon: "patients" },
    { href: "/dashboard/reviews", label: "Reviews", icon: "reviews" },
    { href: "/dashboard/blog", label: "Blog", icon: "blog", badge: clinic?._count.blogPosts },
    { href: "/dashboard/domain", label: "Website & domain", icon: "website" },
    { href: "/dashboard/billing", label: "Plan & billing", icon: "billing" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ];

  const footer = (
    <div className="rounded-xl bg-gradient-to-br from-mint-500 to-mint-400 p-4 text-white">
      {plan ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Current plan</p>
          <p className="mt-1 text-sm font-bold capitalize">{plan}</p>
          <Link href="/dashboard/billing" className="mt-3 inline-block text-xs font-semibold underline">
            Manage billing
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm font-bold">Go live</p>
          <p className="mt-1 text-xs text-white/80">Publish your site and unlock blog posts and reminders.</p>
          <Link href="/dashboard/billing" className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-mint-500">
            See plans
          </Link>
        </>
      )}
    </div>
  );

  return (
    <html lang="en" className={displayFont.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>
          <SidebarNav
            items={items}
            rootHref="/dashboard"
            title="Clinic Growth"
            subtitle={clinic?.name ?? "No clinic yet"}
            email={session.user.email}
            footer={footer}
          />
          <main className="lg:pl-64">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</div>
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
