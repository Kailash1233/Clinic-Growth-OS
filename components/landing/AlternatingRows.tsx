type Row = {
  eyebrow: string;
  heading: string;
  body: string;
  gradient: string;
};

const ROWS: Row[] = [
  {
    eyebrow: "Visibility",
    heading: "Turn nearby searches into appointment requests",
    body: "The score engine surfaces exactly what's holding your clinic back in local search — and what's already working — so nearby searches find you first.",
    gradient: "from-navy-100 via-cream-100 to-white",
  },
  {
    eyebrow: "Conversion",
    heading: "Go from lead to booked appointment without the back-and-forth",
    body: "Click-to-call, WhatsApp, and a contact form are built into every site from day one, so a visitor can reach you the moment they decide to.",
    gradient: "from-gold-400/30 via-cream-100 to-white",
  },
  {
    eyebrow: "Retention",
    heading: "Keep track of who's due for a follow-up",
    body: "Convert a lead into a patient with one click and log their last visit yourself — a simple way to see who hasn't been back in a while.",
    gradient: "from-navy-400/20 via-cream-100 to-white",
  },
];

function AbstractPanel({ gradient }: { gradient: string }) {
  return (
    <div className={`aspect-[4/3] w-full rounded-2xl bg-gradient-to-br ${gradient} shadow-inner`} aria-hidden />
  );
}

export default function AlternatingRows() {
  return (
    <section className="bg-cream-50 px-6 py-20">
      <div className="mx-auto max-w-5xl space-y-20">
        {ROWS.map((row, i) => {
          const imageFirst = i % 2 === 1;
          return (
            <div key={row.heading} className="grid items-center gap-10 sm:grid-cols-2">
              <div className={imageFirst ? "sm:order-2" : ""}>
                <p className="text-xs font-medium uppercase tracking-wide text-gold-600">{row.eyebrow}</p>
                <h3 className="mt-3 font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">
                  {row.heading}
                </h3>
                <p className="mt-4 text-navy-400">{row.body}</p>
              </div>
              <div className={imageFirst ? "sm:order-1" : ""}>
                <AbstractPanel gradient={row.gradient} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
