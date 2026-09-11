import Link from "next/link";
import NavAuthStatus from "@/components/NavAuthStatus";

export default function SimpleHeader() {
  return (
    <header className="border-b border-slate-100">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold text-slate-900">
          Clinic Growth
        </Link>
        <NavAuthStatus />
      </div>
    </header>
  );
}
