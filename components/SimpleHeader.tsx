import Link from "next/link";

export default function SimpleHeader() {
  return (
    <header className="border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-ink-900">
          Clinic<span className="text-mint-500">Growth</span>
        </Link>
        <a href="mailto:hello@yourbrand.in" className="text-sm font-semibold text-mint-500 hover:underline">
          Contact us
        </a>
      </div>
    </header>
  );
}
