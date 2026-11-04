"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavAuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") return <span className="h-8 w-24 animate-pulse rounded-full bg-ink-100" />;

  if (!session?.user) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <Link href="/pricing" className="font-semibold text-ink-700 hover:text-ink-900">
          Pricing
        </Link>
        <Link href="/login" className="rounded-full bg-mint-500 px-4 py-2 font-semibold text-white hover:bg-mint-600">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="hidden max-w-[14rem] truncate text-ink-500 md:inline">{session.user.email}</span>
      <Link href="/pricing" className="font-semibold text-ink-700 hover:text-ink-900">
        Pricing
      </Link>
      {session.user.role === "admin" && (
        <Link href="/admin" prefetch={false} className="font-semibold text-ink-700 hover:text-ink-900">
          Admin
        </Link>
      )}
      <Link href="/dashboard" prefetch={false} className="rounded-full bg-mint-500 px-4 py-2 font-semibold text-white hover:bg-mint-600">
        Dashboard
      </Link>
      <button onClick={() => signOut({ callbackUrl: "/" })} className="font-semibold text-ink-500 hover:text-ink-900">
        Sign out
      </button>
    </div>
  );
}
