"use client";

import { useEffect, useId, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
    };
  }
}

/** Cloudflare Turnstile — requirements §2/§10: on the public search form and signup. */
export default function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const containerId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    if (typeof window === "undefined" || !window.turnstile) return;
    window.turnstile.render(ref.current, {
      sitekey: siteKey,
      callback: onVerify,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) {
    return (
      <p className="text-xs text-slate-400">
        Turnstile not configured — set NEXT_PUBLIC_TURNSTILE_SITE_KEY.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => {
          if (ref.current && window.turnstile) {
            window.turnstile.render(ref.current, { sitekey: siteKey, callback: onVerify });
          }
        }}
      />
      <div id={containerId} ref={ref} />
    </>
  );
}
