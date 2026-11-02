import Link from "next/link";
import NavAuthStatus from "@/components/NavAuthStatus";

export default function SimpleHeader() {
  return (
    <header className="border-b border-navy-100 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-lg font-semibold text-navy-900">
          Growth<span className="text-gold-600">Audit</span>
        </Link>
        <NavAuthStatus />
      </div>
    </header>
  );
}
