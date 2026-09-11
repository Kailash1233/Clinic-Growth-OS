"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TurnstileWidget from "@/components/TurnstileWidget";

export default function HomePage() {
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

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-4xl font-bold text-slate-900">What's your clinic's growth score?</h1>
      <p className="mt-4 text-lg text-slate-600">
        Search your clinic to get an instant score based on your Google presence and site health —
        then generate an AI-built website in the same flow.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-4 text-left">
        <input
          type="text"
          required
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Sunrise Dental Clinic, Mumbai"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base"
        />

        <TurnstileWidget onVerify={setToken} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-5 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Scoring your clinic…" : "Get my growth score"}
        </button>
      </form>
    </main>
  );
}
