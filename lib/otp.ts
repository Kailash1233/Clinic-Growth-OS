import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const OTP_TTL_MINUTES = 10;
const OTP_LENGTH = 6;

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  const max = 10 ** OTP_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

function isEmail(identifier: string): boolean {
  return identifier.includes("@");
}

/** Sends a one-time code to an email or phone identifier, storing its hash for verification. */
export async function sendOtp(identifier: string): Promise<void> {
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { identifier, codeHash, expiresAt },
  });

  if (isEmail(identifier)) {
    await sendOtpEmail(identifier, code);
  } else {
    await sendOtpSms(identifier, code);
  }
}

export async function verifyOtp(identifier: string, code: string): Promise<boolean> {
  const codeHash = hashCode(code);

  const record = await prisma.otpCode.findFirst({
    where: { identifier, codeHash, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return true;
}

/** MSG91 SMS OTP — swap for Twilio Verify by changing this function only. */
async function sendOtpSms(phone: string, code: string): Promise<void> {
  const apiKey = process.env.OTP_PROVIDER_API_KEY;
  if (!apiKey) {
    console.warn(`[otp] OTP_PROVIDER_API_KEY not set — dev fallback, code for ${phone}: ${code}`);
    return;
  }

  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: apiKey },
    body: JSON.stringify({ mobile: phone, otp: code, template_id: process.env.MSG91_TEMPLATE_ID }),
  });

  if (!res.ok) {
    throw new Error(`OTP SMS send failed: ${res.status} ${await res.text()}`);
  }
}

/** Email OTP fallback via Resend, per requirements §2 (transactional email). */
async function sendOtpEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[otp] RESEND_API_KEY not set — dev fallback, code for ${email}: ${code}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "noreply@example.com",
      to: email,
      subject: "Your verification code",
      text: `Your verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    }),
  });

  if (!res.ok) {
    throw new Error(`OTP email send failed: ${res.status} ${await res.text()}`);
  }
}
