"use client";

import { useState } from "react";
import { Inbox, MessageCircle, Phone, UserPlus } from "lucide-react";
import { Badge, EmptyState, Table, Td, Th, buttonStyles } from "@/components/app/ui";

type LeadRow = {
  id: string;
  name: string | null;
  phone: string | null;
  source: string;
  message: string | null;
  createdAt: string;
  isPatient: boolean;
};

const SOURCES: Record<string, { label: string; icon: typeof Phone }> = {
  contact_form: { label: "Contact form", icon: Inbox },
  click_to_call: { label: "Call tap", icon: Phone },
  whatsapp: { label: "WhatsApp tap", icon: MessageCircle },
};

export default function LeadsTable({ initialLeads }: { initialLeads: LeadRow[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/leads/${id}/convert`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not convert this lead.");
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, isPatient: true } : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-6 w-6" />}
        title="No leads yet"
        description="When a patient fills in the contact form on your website, or taps its Call or WhatsApp button, the enquiry appears here."
      />
    );
  }

  return (
    <>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Phone</Th>
            <Th>Source</Th>
            <Th>Message</Th>
            <Th>Received</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const src = SOURCES[lead.source] ?? { label: lead.source, icon: Inbox };
            return (
              <tr key={lead.id} className="hover:bg-slate-50/60">
                <Td className="font-medium text-slate-900">{lead.name ?? "—"}</Td>
                <Td>{lead.phone ? <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a> : "—"}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <src.icon className="h-3.5 w-3.5" /> {src.label}
                  </span>
                </Td>
                <Td className="max-w-xs truncate" >{lead.message ?? "—"}</Td>
                <Td className="whitespace-nowrap text-slate-500">
                  {new Date(lead.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </Td>
                <Td className="text-right">
                  {lead.isPatient ? (
                    <Badge tone="green">Patient</Badge>
                  ) : (
                    <button onClick={() => handleConvert(lead.id)} disabled={busyId === lead.id} className={buttonStyles.secondary}>
                      <UserPlus className="h-4 w-4" />
                      {busyId === lead.id ? "Converting…" : "Make patient"}
                    </button>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
