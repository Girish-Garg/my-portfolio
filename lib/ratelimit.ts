import "server-only";
import { createClient } from "redis";

/**
 * Per-IP fixed-window rate limiting to protect the shared Gemini free-tier quota.
 *
 * Uses the shared Redis 7 instance when REDIS_HOST, REDIS_PORT, and
 * REDIS_PASSWORD are set. Without them it falls back to an in-memory counter,
 * which is fine for local dev but only counts within a single running process.
 */

const MINUTE_LIMIT = Number(process.env.CHAT_RATE_PER_MINUTE ?? 8);
const DAY_LIMIT = Number(process.env.CHAT_RATE_PER_DAY ?? 40);

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const useRedis = Boolean(REDIS_HOST && REDIS_PASSWORD && Number.isInteger(REDIS_PORT));

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

// --- Redis ------------------------------------------------------------------

type RedisClient = ReturnType<typeof createClient>;

const redisState = globalThis as typeof globalThis & {
  chatRateLimitRedis?: RedisClient;
  chatRateLimitRedisConnection?: Promise<RedisClient>;
};

function getRedis(): Promise<RedisClient> {
  if (redisState.chatRateLimitRedis?.isReady) {
    return Promise.resolve(redisState.chatRateLimitRedis);
  }

  if (!redisState.chatRateLimitRedis) {
    const client = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
      password: REDIS_PASSWORD,
    });
    client.on("error", () => {
      if (!client.isReady) redisState.chatRateLimitRedisConnection = undefined;
    });
    redisState.chatRateLimitRedis = client;
  }

  if (!redisState.chatRateLimitRedisConnection) {
    redisState.chatRateLimitRedisConnection = redisState.chatRateLimitRedis
      .connect()
      .then(() => redisState.chatRateLimitRedis!)
      .catch((error) => {
        redisState.chatRateLimitRedisConnection = undefined;
        throw error;
      });
  }

  return redisState.chatRateLimitRedisConnection;
}

async function redisHit(
  key: string,
  seconds: number,
  limit: number,
): Promise<boolean> {
  const client = await getRedis();
  const results = await client
    .multi()
    .incr(key)
    .expire(key, seconds, "NX")
    .exec();
  const count = Number(results[0] ?? 0);
  return count > limit;
}

// --- Public API -------------------------------------------------------------

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const id = ip || "unknown";

  for (const w of WINDOWS) {
    const bucket = Math.floor(Date.now() / (w.seconds * 1000));
    const key = `my-portfolio:chat:rl:${w.label}:${id}:${bucket}`;
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
