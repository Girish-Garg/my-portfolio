/**
 * Per-IP fixed-window rate limiting to protect the shared Gemini free-tier quota.
 *
 * Uses Upstash Redis over its REST API when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set (the production path - works across stateless
 * serverless invocations). Without them it falls back to an in-memory counter,
 * which is fine for local dev but only counts within a single running process.
 */

const MINUTE_LIMIT = Number(process.env.CHAT_RATE_PER_MINUTE ?? 8);
const DAY_LIMIT = Number(process.env.CHAT_RATE_PER_DAY ?? 40);

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(REST_URL && REST_TOKEN);

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

type Window = { limit: number; seconds: number; label: string };

const WINDOWS: Window[] = [
  { limit: MINUTE_LIMIT, seconds: 60, label: "m" },
  { limit: DAY_LIMIT, seconds: 86400, label: "d" },
];

// --- In-memory fallback -----------------------------------------------------

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryHit(key: string, seconds: number, limit: number): boolean {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + seconds * 1000 });
    return 1 > limit;
  }
  entry.count += 1;
  return entry.count > limit;
}

// --- Upstash REST -----------------------------------------------------------

async function redisHit(
  key: string,
  seconds: number,
  limit: number,
): Promise<boolean> {
  // INCR then set an expiry only on first write (NX) so the window is fixed.
  const res = await fetch(`${REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(seconds), "NX"],
    ]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const data = (await res.json()) as { result: number }[];
  const count = Number(data?.[0]?.result ?? 0);
  return count > limit;
}

// --- Public API -------------------------------------------------------------

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const id = ip || "unknown";

  for (const w of WINDOWS) {
    const bucket = Math.floor(Date.now() / (w.seconds * 1000));
    const key = `chat:rl:${w.label}:${id}:${bucket}`;
    try {
      const over = useRedis
        ? await redisHit(key, w.seconds, w.limit)
        : memoryHit(key, w.seconds, w.limit);
      if (over) return { ok: false, retryAfter: w.seconds };
    } catch {
      // If the limiter backend is unreachable, fail open rather than block a
      // real visitor. The input cap and low output tokens still bound cost.
    }
  }

  return { ok: true };
}
