import SearchForm from "@/components/landing/SearchForm";

/**
 * Real clinician photography isn't available in this build environment —
 * per the brief's own honesty constraints ("coming soon" placeholders over
 * fake polished mockups), this ships as an intentional abstract graphic
 * (growth-line motif) rather than a stock-photo stand-in. Swap in a real
 * photo by replacing the gradient block below with an <Image>.
 */
export default function Hero() {
  const badgeText = process.env.NEXT_PUBLIC_HERO_BADGE_TEXT || "Built for Indian clinics";

  return (
    <section className="relative overflow-hidden bg-navy-950 pb-20 pt-32 sm:pb-28 sm:pt-40">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-90 lg:block"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(217,174,92,0.25),transparent_55%),radial-gradient(circle_at_40%_70%,rgba(61,90,112,0.5),transparent_60%)]" />
        <svg viewBox="0 0 400 400" className="absolute right-0 top-1/2 h-[420px] w-[420px] -translate-y-1/2 translate-x-16 opacity-70">
          <polyline
            points="10,320 90,260 150,290 220,180 290,210 380,60"
            fill="none"
            stroke="#D9AE5C"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            [10, 320],
            [90, 260],
            [150, 290],
            [220, 180],
            [290, 210],
            [380, 60],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={5} fill="#FBF8F2" />
          ))}
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/95 to-transparent lg:via-navy-950/70" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-white/80">
            {badgeText}
          </span>

          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl">
            The growth system that knows <em className="text-gold-400 not-italic">your clinic</em>
          </h1>

          <p className="mt-5 max-w-lg text-lg text-white/70">
            One place that pulls your Google presence, site health, and reviews together — then
            builds and hosts the website that turns it into appointments.
          </p>

          <div className="mt-9">
            <SearchForm variant="hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
