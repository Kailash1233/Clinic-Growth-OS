export type SendResult = { delivered: boolean; error?: string };

export function appUrl(path = ""): string {
  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

/** Transactional email via Resend. Without a key, logs the email instead of pretending it was sent. */
export async function sendEmail(params: { to: string; subject: string; text: string }): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — not sent. To: ${params.to} | ${params.subject}\n${params.text}`);
    return { delivered: false, error: "RESEND_API_KEY not set" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "noreply@example.com",
        to: params.to,
        subject: params.subject,
        text: params.text,
      }),
    });
    if (!res.ok) return { delivered: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { delivered: true };
  } catch (err) {
    return { delivered: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * SMS via an MSG91 Flow template. Indian SMS needs a DLT-approved template, so
 * this only sends when MSG91_PHOTO_REMINDER_TEMPLATE_ID is configured.
 */
export async function sendTemplateSms(params: {
  phone: string;
  templateId: string | undefined;
  variables: Record<string, string>;
}): Promise<SendResult> {
  const apiKey = process.env.OTP_PROVIDER_API_KEY;
  if (!apiKey || !params.templateId) {
    return { delivered: false, error: "MSG91 key or template id not set" };
  }
  try {
    const res = await fetch("https://control.msg91.com/api/v5/flow", {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: apiKey },
      body: JSON.stringify({
        template_id: params.templateId,
        recipients: [{ mobiles: params.phone.replace(/^\+/, ""), ...params.variables }],
      }),
    });
    if (!res.ok) return { delivered: false, error: `MSG91 ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { delivered: true };
  } catch (err) {
    return { delivered: false, error: err instanceof Error ? err.message : String(err) };
  }
}
