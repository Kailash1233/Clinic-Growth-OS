"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TurnstileWidget from "@/components/TurnstileWidget";

const DEMO_BUSINESS_NAME = "Srinivasan Chess Academy";

/**
 * Hits the real /api/clinics/search endpoint (Turnstile + rate-limited,
 * requirements.md §10) — used in both the hero and the final-CTA section.
 * In demo mode (no GOOGLE_PLACES_API_KEY set) the search still runs for
 * real, it just resolves against lib/mockBusinessData.ts instead of the
 * live Places API — same endpoint, same code path either way.
 */
export default function SearchForm({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function runAudit(value: string) {
    if (!token) {
      setError("Please complete the verification challenge.");
      return;
    }
    setLoading(true);
    setError(null);
    sessionStorage.setItem("pendingAudit", JSON.stringify({ query: value, token }));
    router.push("/audit/running");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runAudit(query);
  }

  const isHero = variant === "hero";

  return (
    <div className="w-full max-w-xl space-y-3 text-left">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your business name"
            className={
              isHero
                ? "w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3.5 text-base text-white placeholder:text-white/50 backdrop-blur focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                : "w-full rounded-lg border border-navy-100 bg-white px-4 py-3 text-base text-navy-900 placeholder:text-navy-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
            }
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-lg bg-gold-500 px-6 py-3.5 font-medium text-navy-950 transition hover:bg-gold-400 disabled:opacity-50"
          >
            {loading ? "Starting…" : "Run My Growth Audit"}
          </button>
        </div>

        {/* Both variants ship on dark sections (hero, trust banner) — helper text stays light. */}
        <div className="text-white/70">
          <TurnstileWidget onVerify={setToken} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/60">
        <span>Can&apos;t find your business? Try adding your city.</span>
        <span className="text-white/30">·</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setQuery(DEMO_BUSINESS_NAME);
            runAudit(DEMO_BUSINESS_NAME);
          }}
          className="font-medium text-gold-400 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Or see a live example: {DEMO_BUSINESS_NAME} →
        </button>
      </div>
    </div>
  );
}
