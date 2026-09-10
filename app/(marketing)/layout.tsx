import type { ReactNode } from "react";
import Link from "next/link";
import "@/app/globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import NavAuthStatus from "@/components/NavAuthStatus";

export const metadata = {
  title: "Clinic Growth — see your clinic's growth score",
  description: "Search your clinic, get an instant growth score, and launch an AI-built website in minutes.",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <SessionProvider>
          <header className="border-b border-slate-100">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
              <Link href="/" className="font-semibold text-slate-900">
                Clinic Growth
              </Link>
              <NavAuthStatus />
            </div>
          </header>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
