"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_BUSINESS_NAME = "Lakshmi Dental Care";

/**
 * Frontend-only build: there's no server to protect, so this just stores
 * the query and hands off to /audit/running, which runs the whole
 * search -> score -> insights pipeline client-side (lib/runAudit.ts).
 */
export default function SearchForm({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  function runAudit(value: string) {
    setLoading(true);
    sessionStorage.setItem("pendingAudit", JSON.stringify({ query: value }));
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
                ? "w-full rounded-full border border-ink-200 bg-white px-5 py-3.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30"
                : "w-full rounded-full border border-white/20 bg-white/10 px-5 py-3.5 text-base text-white placeholder:text-white/50 backdrop-blur focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-400/40"
            }
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-full bg-mint-500 px-6 py-3.5 font-semibold text-white transition hover:bg-mint-600 disabled:opacity-50"
          >
            {loading ? "Starting…" : "Run My Growth Audit"}
          </button>
        </div>
      </form>

      <div
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${isHero ? "text-ink-500" : "text-white/60"}`}
      >
        <span>Can&apos;t find your business? Try adding your city.</span>
        <span className={isHero ? "text-ink-200" : "text-white/30"}>·</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setQuery(DEMO_BUSINESS_NAME);
            runAudit(DEMO_BUSINESS_NAME);
          }}
          className={`font-semibold underline-offset-2 hover:underline disabled:opacity-50 ${
            isHero ? "text-mint-500" : "text-mint-400"
          }`}
        >
          Or see a live example: {DEMO_BUSINESS_NAME} →
        </button>
      </div>
    </div>
  );
}
