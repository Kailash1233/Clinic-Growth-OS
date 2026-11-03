/**
 * Demo mode — the whole point of this fork.
 *
 * Every external integration (Google Places, PageSpeed, OpenAI) checks its
 * own key and silently falls back to realistic mock data when that key is
 * absent. There is no separate "demo flag" to flip: drop a real key into
 * `.env` and that one integration switches to the real API on its own,
 * nothing else changes. See README-DEMO.md.
 */

export const demoFlags = {
  places: !process.env.GOOGLE_PLACES_API_KEY,
  pagespeed: !process.env.GOOGLE_PAGESPEED_API_KEY,
  openai: !process.env.OPENAI_API_KEY,
};

export function isFullyLive(): boolean {
  return !demoFlags.places && !demoFlags.pagespeed && !demoFlags.openai;
}

/** A believable network delay so mocked calls don't resolve suspiciously instantly. */
export function demoDelay(minMs = 400, maxMs = 900): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
