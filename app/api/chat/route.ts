import { headers } from "next/headers";
import { profile } from "@/content/portfolio";
import { buildSystemPrompt } from "@/lib/knowledge";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  streamReply,
  geminiConfigured,
  GeminiQuotaError,
  type ChatTurn,
} from "@/lib/gemini";

// Guardrails. The input cap and turn cap bound how much we ever send upstream;
// the rate limiter bounds how often. Together they keep the shared free-tier
// quota from being burned by one visitor or a scripted loop.
const MAX_INPUT_CHARS = 600;
const MAX_TURNS = 12;

const FALLBACK = `I'm taking a short break right now, so the chat is offline. For anything specific, email me at ${profile.email} and I'll get back to you.`;

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

function clientIp(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "";
}

function parseTurns(raw: unknown): ChatTurn[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const turns: ChatTurn[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { role, text } = m as { role?: unknown; text?: unknown };
    if (role !== "user" && role !== "model") return null;
    if (typeof text !== "string") return null;
    turns.push({ role, text });
  }
  return turns;
}

export async function POST(request: Request) {
  // If the key is not configured, behave exactly like the offline state rather
  // than 500ing - the UI shows the same calm message either way.
  if (!geminiConfigured) {
    return json({ error: "offline", message: FALLBACK }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_request", message: "Could not read request." }, 400);
  }

  const turns = parseTurns((body as { messages?: unknown })?.messages);
  if (!turns) {
    return json({ error: "bad_request", message: "No message provided." }, 400);
  }

  // Keep only the most recent turns so the context window and cost stay bounded.
  const history = turns.slice(-MAX_TURNS);

  const last = history[history.length - 1]!;
  if (last.role !== "user" || last.text.trim().length === 0) {
    return json({ error: "bad_request", message: "No message provided." }, 400);
  }
  if (last.text.length > MAX_INPUT_CHARS) {
    return json(
      { error: "too_long", message: "That message is a bit long - try trimming it." },
      400,
    );
  }

  const h = await headers();
  const limit = await checkRateLimit(clientIp(h));
  if (!limit.ok) {
    return json(
      {
        error: "rate_limited",
        message: `You've hit the chat limit for now. Email me at ${profile.email} and I'll reply directly.`,
        retryAfter: limit.retryAfter,
      },
      429,
    );
  }

  const systemPrompt = buildSystemPrompt();
  const generator = streamReply(systemPrompt, history, request.signal);

  // Pull the first chunk before responding so quota/errors surface as a clean
  // JSON fallback instead of a half-streamed 200.
  let firstChunk: string | undefined;
  try {
    const first = await generator.next();
    if (!first.done) firstChunk = first.value;
  } catch (err) {
    if (err instanceof GeminiQuotaError) {
      return json({ error: "quota", message: FALLBACK }, 503);
    }
    return json({ error: "upstream", message: FALLBACK }, 502);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (firstChunk) controller.enqueue(encoder.encode(firstChunk));
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch {
        // Mid-stream failure: close cleanly with whatever we have rather than
        // erroring the response, so the visitor keeps the partial answer.
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
