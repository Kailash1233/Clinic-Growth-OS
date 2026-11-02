"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateDemoButton({ clinicId }: { clinicId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinics/${clinicId}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-gold-500 px-6 py-3 font-medium text-navy-950 transition hover:bg-gold-400 disabled:opacity-50"
      >
        {loading ? "Generating your site…" : "Generate my free AI demo site"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
