"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Building2,
  CreditCard,
  Cpu,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  Star,
  Users,
  UserRound,
  X,
} from "lucide-react";

const ICONS = {
  overview: LayoutDashboard,
  leads: Users,
  patients: UserRound,
  reviews: Star,
  blog: FileText,
  website: Globe,
  billing: CreditCard,
  settings: Settings,
  clinics: Building2,
  usage: BarChart3,
  prompt: Cpu,
  messages: MessageSquareText,
} as const;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number };

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function SidebarNav({
  items,
  rootHref,
  title,
  subtitle,
  email,
  footer,
}: {
  items: NavItem[];
  rootHref: string;
  title: string;
  subtitle?: string;
  email?: string | null;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href, item.href === rootHref);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-mint-50 text-mint-500" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-mint-500" : "text-slate-400 group-hover:text-slate-600"}`} />
            <span className="flex-1">{item.label}</span>
            {!!item.badge && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{item.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const account = (
    <div className="border-t border-slate-200 pt-4">
      {footer}
      <div className="mt-3 flex items-center gap-3 rounded-lg px-2 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-500 text-xs font-bold uppercase text-white">
          {(email ?? "?").slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-900" title={email ?? ""}>
            {email}
          </p>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/" })} title="Sign out" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </button>
      </div>
    </div>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-2 px-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500 text-sm font-bold text-white">C</span>
      <span>
        <span className="block text-sm font-bold leading-tight text-slate-900">{title}</span>
        {subtitle && <span className="block max-w-[10rem] truncate text-xs leading-tight text-slate-500">{subtitle}</span>}
      </span>
    </Link>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        {brand}
        <div className="mt-8 flex flex-1 flex-col">{nav}</div>
        {account}
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        {brand}
        <button onClick={() => setOpen(true)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white px-4 py-5 shadow-xl">
            <div className="flex items-center justify-between">
              {brand}
              <button onClick={() => setOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-8 flex flex-1 flex-col">{nav}</div>
            {account}
          </aside>
        </div>
      )}
    </>
  );
}
