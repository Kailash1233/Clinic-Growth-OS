import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "@/app/globals.css";

// STKBureauSans (Owner.com's own typeface) isn't legally distributable here —
// Inter is the closest widely-available alternative: a clean geometric sans
// with the same confident, compact character.
const display = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata = {
  title: "Clinic Growth — see your clinic's growth score",
  description: "Search your clinic, get an instant growth score, and launch an AI-built website in minutes.",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <body className="min-h-screen bg-white text-ink-900 antialiased">{children}</body>
    </html>
  );
}
