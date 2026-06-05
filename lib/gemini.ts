/**
 * Thin streaming client for the Gemini REST API. We deliberately avoid the SDK:
 * one fetch to the streamGenerateContent SSE endpoint, parsed into a stream of
 * plain text chunks, keeps the dependency surface and bundle small.
 *
 * The model and key come from the environment (GEMINI_MODEL, GEMINI_API_KEY) so
 * nothing secret is ever bundled or committed.
 */

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const MAX_OUTPUT_TOKENS = Number(process.env.CHAT_MAX_OUTPUT_TOKENS ?? 400);

export const geminiConfigured = Boolean(API_KEY);

export type ChatTurn = { role: "user" | "model"; text: string };

/**
 * Thrown when Gemini reports it is out of quota (429) so the caller can show the
 * calm "taking a break" fallback rather than a generic error.
 */
export class GeminiQuotaError extends Error {}

type GeminiChunk = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
  }[];
};

/**
 * Streams the model's reply as an async iterable of text fragments. Throws
 * GeminiQuotaError on 429 and a plain Error on any other non-OK response.
 */
export async function* streamReply(
  systemPrompt: string,
  history: ChatTurn[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${API_KEY}`;

  // Gemma models on the Gemini API reject `systemInstruction`, so fold the
  // prompt into the first user turn. Gemini models accept it natively.
  const isGemma = MODEL.toLowerCase().startsWith("gemma");
  const contents = history.map((t) => ({
    role: t.role,
    parts: [{ text: t.text }],
  }));
  if (isGemma && contents.length > 0) {
    contents[0] = {
      role: "user",
      parts: [{ text: `${systemPrompt}\n\n${contents[0].parts[0].text}` }],
    };
  }

  // Gemini 2.5 models spend hidden "thinking" tokens out of the same
  // maxOutputTokens budget before emitting the visible answer. For a short
  // factual chat that's pure waste - it eats the budget and truncates the
  // real reply mid-sentence. Disable thinking on 2.5; older models ignore it.
  const isThinkingCapable = MODEL.toLowerCase().includes("2.5");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal,
    body: JSON.stringify({
      ...(isGemma
        ? {}
        : { systemInstruction: { parts: [{ text: systemPrompt }] } }),
      contents,
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.4,
        ...(isThinkingCapable ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error(`[gemini] ${res.status} ${res.statusText}: ${body.slice(0, 600)}`);
    if (res.status === 429) throw new GeminiQuotaError("Gemini quota exhausted");
    throw new Error(`Gemini error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line; process whole lines only.
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json || json === "[DONE]") continue;
      try {
        const chunk = JSON.parse(json) as GeminiChunk;
        const text = chunk.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("");
        if (text) yield text;
      } catch {
        // Ignore partial/malformed frames; the next read will complete them.
      }
    }
  }
}
