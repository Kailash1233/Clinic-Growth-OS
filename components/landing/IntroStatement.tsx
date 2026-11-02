const STATS: [string, string][] = [
  ["120+", "Clinics scored"],
  ["98%", "Would recommend"],
  ["30+", "Cities covered"],
  ["4.9", "Avg. rating"],
];

export default function IntroStatement() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-8 border-y border-ink-100 py-10 sm:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-ink-900 sm:text-4xl">{value}</p>
              <p className="mt-1 text-sm text-ink-500">{label}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-lg leading-relaxed text-ink-500">
          A clinic&apos;s growth depends on being found, being trusted, and being easy to book
          with — but that story is scattered across a Google Business Profile, a website that may
          or may not exist, and whatever patients say after they leave. Clinic Growth pulls all
          three into one place, scores where you actually stand, and builds the site that turns it
          into appointments.
        </p>
      </div>
    </section>
  );
}
