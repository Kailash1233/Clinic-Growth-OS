"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavAuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session) {
    return (
      <Link href="/login" className="text-sm font-medium text-gold-600 hover:underline">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <Link href="/dashboard" className="font-medium text-gold-600 hover:underline">
        Dashboard
      </Link>
      {session.user.role === "admin" && (
        <Link href="/admin" className="font-medium text-gold-600 hover:underline">
          Admin
        </Link>
      )}
      <button onClick={() => signOut({ callbackUrl: "/" })} className="text-navy-400 hover:text-navy-700">
        Sign out
      </button>
    </div>
  );
}
