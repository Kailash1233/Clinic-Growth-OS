import { Avatar } from "@/components/illustrations";

const QUOTES = [
  {
    quote:
      "We went from barely showing up in local search to fully booked most weeks. The score made it obvious what to fix first.",
    name: "Dr. Ananya Rao",
    role: "Smile Care Dental, Bengaluru",
  },
  {
    quote:
      "Patients started mentioning they found us online within the first month. The reply drafts alone saved us hours every week.",
    name: "Dr. Vikram Shah",
    role: "Shah Physiotherapy Clinic, Pune",
  },
  {
    quote:
      "Our new site paid for itself in the first week of bookings. Setup took less time than a single patient visit.",
    name: "Dr. Priya Menon",
    role: "Menon Eye Care, Chennai",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-mint-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-ink-900 sm:text-4xl">
          Clinics growing with us
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {QUOTES.map((t, i) => (
            <div key={t.name} className="rounded-2xl bg-white p-6 shadow-sm shadow-ink-900/5">
              <p className="text-sm leading-relaxed text-ink-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <Avatar seed={i} className="h-11 w-11 shrink-0 rounded-full" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                  <p className="text-xs text-ink-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
