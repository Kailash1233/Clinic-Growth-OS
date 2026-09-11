"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TurnstileWidget from "@/components/TurnstileWidget";

/**
 * Hits the real /api/clinics/search endpoint (Turnstile + rate-limited,
 * requirements.md §10) — used in both the hero and the final-CTA section,
 * per landing-page-v2-prompt.md's technical constraints. Not a mockup.
 */
export default function SearchForm({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Please complete the verification challenge.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/clinics/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, turnstileToken: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      router.push(`/clinic/${data.clinic.id}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  const isHero = variant === "hero";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-3 text-left">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          required
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your clinic name"
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
          {loading ? "Scoring…" : "Find My Clinic"}
        </button>
      </div>

      {/* Both variants ship on dark sections (hero, trust banner) — helper text stays light. */}
      <div className="text-white/70">
        <TurnstileWidget onVerify={setToken} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <p className="text-sm text-white/60">Can&apos;t find your clinic? Try adding your city.</p>
    </form>
  );
}
