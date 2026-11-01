import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";
import "@/app/globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "Clinic Growth — see your clinic's growth score",
  description: "Search your clinic, get an instant growth score, and launch an AI-built website in minutes.",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-cream-50 text-navy-900 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
