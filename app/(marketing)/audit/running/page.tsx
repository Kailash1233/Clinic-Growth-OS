"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuditProgress from "@/components/AuditProgress";

type Pending = { query: string; token: string };
type FetchOutcome = { ok: true; clinicId: string } | { ok: false; error: string };

export default function AuditRunningPage() {
  const router = useRouter();
  const [query, setQuery] = useState<string | null>(null);
  const [animationDone, setAnimationDone] = useState(false);
  const [fetchOutcome, setFetchOutcome] = useState<FetchOutcome | null>(null);
  const navigated = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingAudit");
    if (!raw) {
      router.replace("/");
      return;
    }
    const pending = JSON.parse(raw) as Pending;
    setQuery(pending.query);

    fetch("/api/clinics/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: pending.query, turnstileToken: pending.token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "We couldn't find that business.");
        setFetchOutcome({ ok: true, clinicId: data.clinic.id });
      })
      .catch((err: Error) => {
        setFetchOutcome({ ok: false, error: err.message || "Something went wrong." });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!animationDone || !fetchOutcome || navigated.current) return;
    navigated.current = true;
    sessionStorage.removeItem("pendingAudit");
    if (fetchOutcome.ok) {
      router.push(`/clinic/${fetchOutcome.clinicId}`);
    }
  }, [animationDone, fetchOutcome, router]);

  const failed = animationDone && fetchOutcome && !fetchOutcome.ok;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy-950 px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(217,174,92,0.12),transparent_55%)]" />
      </div>

      <div className="relative w-full max-w-lg">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-white/50">
          Running growth audit
        </p>
        <h1 className="mt-3 text-center font-serif text-2xl font-semibold text-white sm:text-3xl">
          {query ? <>Auditing &ldquo;{query}&rdquo;&hellip;</> : "Starting your audit…"}
        </h1>
        <p className="mt-2 text-center text-sm text-white/60">
          This takes a few seconds — we&apos;re pulling real signals together.
        </p>

        <div className="mt-10 rounded-2xl bg-white p-8 shadow-2xl">
          {!failed ? (
            <AuditProgress onDone={() => setAnimationDone(true)} />
          ) : (
            <div className="text-center">
              <p className="font-medium text-navy-900">{fetchOutcome && !fetchOutcome.ok ? fetchOutcome.error : "Something went wrong."}</p>
              <a
                href="/"
                className="mt-4 inline-block rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-medium text-navy-950 hover:bg-gold-400"
              >
                Try again
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
