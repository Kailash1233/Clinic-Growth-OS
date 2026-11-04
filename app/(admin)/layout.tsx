import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/app/globals.css";
import { displayFont } from "@/lib/fonts";
import SessionProvider from "@/components/providers/SessionProvider";
import SidebarNav, { type NavItem } from "@/components/app/SidebarNav";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Clinics", icon: "clinics" },
  { href: "/admin/usage", label: "API usage", icon: "usage" },
  { href: "/admin/prompt", label: "Prompt template", icon: "prompt" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login?next=/admin");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <html lang="en" className={displayFont.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>
          <SidebarNav
            items={ITEMS}
            rootHref="/admin"
            title="Clinic Growth"
            subtitle="Admin console"
            email={session.user.email}
            footer={
              <Link href="/dashboard" className="block rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Open owner dashboard →
              </Link>
            }
          />
          <main className="lg:pl-64">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">{children}</div>
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
