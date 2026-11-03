import type { z } from "zod";
import { requireEnv } from "@/lib/env";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 60_000;

export class AiGenerationError extends Error {}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function groqModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

async function chat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireEnv("GROQ_API_KEY")}`,
    },
    body: JSON.stringify({
      model: groqModel(),
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const body = await res.text();
  if (!res.ok) {
    // Groq answers 400 json_validate_failed when the model's output wasn't JSON;
    // the caller retries that once, every other status is a real error.
    throw new AiGenerationError(`Groq ${res.status}: ${body.slice(0, 500)}`);
  }

  const content = (JSON.parse(body) as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message
    ?.content;
  if (!content) throw new AiGenerationError("Groq returned an empty response");
  return content;
}

/**
 * Asks a Llama model on Groq for one JSON object and validates it with zod.
 * Llama models on Groq support JSON mode but not strict schemas, so the shape
 * goes in the prompt and the zod schema enforces it. One retry tells the model
 * exactly what was wrong with its first answer.
 */
export async function groqJson<T>(params: {
  system: string;
  user: string;
  shape: string;
  schema: z.ZodType<T>;
}): Promise<T> {
  const messages: ChatMessage[] = [
    { role: "system", content: params.system },
    {
      role: "user",
      content: `${params.user}\n\nRespond with only a JSON object of exactly this shape:\n${params.shape}`,
    },
  ];

  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: string;
    try {
      raw = await chat(messages);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (attempt === 0 && message.includes("json_validate_failed")) {
        lastError = message;
        continue;
      }
      throw err;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      lastError = "The response was not valid JSON.";
      messages.push({ role: "assistant", content: raw }, { role: "user", content: `${lastError} Reply with the JSON object only.` });
      continue;
    }

    const result = params.schema.safeParse(parsed);
    if (result.success) return result.data;

    lastError = result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    messages.push(
      { role: "assistant", content: raw },
      { role: "user", content: `That JSON did not match the required shape (${lastError}). Reply with the corrected JSON object only.` }
    );
  }

  throw new AiGenerationError(`Groq output failed validation twice: ${lastError}`);
}
