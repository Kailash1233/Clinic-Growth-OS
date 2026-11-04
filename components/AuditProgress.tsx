"use client";

import { useEffect, useRef, useState } from "react";

export type AuditStep = { label: string; detail: string };

export const AUDIT_STEPS: AuditStep[] = [
  { label: "Fetching Google Business Profile", detail: "Name, category, hours, rating" },
  { label: "Checking visibility & completeness", detail: "Photos, hours, operational status" },
  { label: "Scanning for an existing website", detail: "Load speed, mobile-friendliness, SEO basics" },
  { label: "Reviewing recent customer feedback", detail: "Rating trend, review recency" },
  { label: "Calculating your growth score", detail: "Weighing all four signals together" },
];

/**
 * A choreographed step-by-step reveal — not tied to the real request's
 * actual timing, just a believable pace for each labeled stage. The caller
 * awaits `minDurationMs` (via onDone) alongside its real fetch so the UI
 * never looks like it finished before the work plausibly could have.
 */
export default function AuditProgress({ onDone }: { onDone?: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const calledDone = useRef(false);

  useEffect(() => {
    const stepDurations = [900, 850, 1100, 800, 750];
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    stepDurations.forEach((duration, i) => {
      elapsed += duration;
      timers.push(
        setTimeout(() => {
          setDoneCount(i + 1);
          setActiveIndex(i + 1);
        }, elapsed)
      );
    });

    timers.push(
      setTimeout(() => {
        if (!calledDone.current) {
          calledDone.current = true;
          onDone?.();
        }
      }, elapsed + 150)
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressPct = Math.min(100, (doneCount / AUDIT_STEPS.length) * 100);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-mint-500 transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ul className="mt-8 space-y-5">
        {AUDIT_STEPS.map((step, i) => {
          const isDone = i < doneCount;
          const isActive = i === activeIndex && !isDone;
          return (
            <li key={step.label} className="flex items-start gap-3">
              <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                {isDone ? (
                  <span className="flex h-6 w-6 scale-100 items-center justify-center rounded-full bg-mint-500 text-white opacity-100 transition-all duration-300">
                    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                      <path d="M4 10.5l3.5 3.5L16 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : isActive ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-100 border-t-mint-500" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-ink-100" />
                )}
              </span>
              <div className={`transition-opacity duration-300 ${isDone || isActive ? "opacity-100" : "opacity-40"}`}>
                <p className={`text-sm font-semibold ${isDone ? "text-ink-900" : isActive ? "text-ink-900" : "text-ink-400"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-ink-400">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
