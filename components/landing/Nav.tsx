"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

/** Marketing top bar. Signed in: email, Dashboard (and Admin), Sign out. Signed out: Pricing, Login. */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-ink-100 bg-white/90 backdrop-blur" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-bold text-ink-900">
          Clinic<span className="text-mint-500">Growth</span>
        </Link>
        <div className="flex items-center gap-2 text-sm sm:gap-4">
          <Link href="/pricing" className="rounded-full px-3 py-2 font-semibold text-ink-700 hover:text-ink-900">
            Pricing
          </Link>
          {status === "loading" ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-ink-100" />
          ) : session?.user ? (
            <>
              <span className="hidden max-w-[14rem] truncate text-ink-500 md:inline" title={session.user.email ?? ""}>
                {session.user.email}
              </span>
              {session.user.role === "admin" && (
                <Link href="/admin" prefetch={false} className="rounded-full px-3 py-2 font-semibold text-ink-700 hover:text-ink-900">
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                prefetch={false}
                className="rounded-full bg-mint-500 px-5 py-2.5 font-semibold text-white transition hover:bg-mint-600"
              >
                Dashboard
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="px-2 py-2 font-semibold text-ink-500 hover:text-ink-900">
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-mint-500 px-5 py-2.5 font-semibold text-white transition hover:bg-mint-600"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
