import { getRedis } from "@/lib/queues";

export type RateLimitResult = { ok: boolean; remaining: number; backend: "redis" | "memory" };

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * In-memory fallback. Correct for a single long-lived process (the worker),
 * but on serverless each instance keeps its own map — Redis is authoritative
 * whenever REDIS_URL is configured.
 */
function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, backend: "memory" };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0, backend: "memory" };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count, backend: "memory" };
}

/** Fixed-window counter in Redis. Shared across every serverless instance. */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) return memoryLimit(key, limit, windowMs);

  const namespaced = `vidlix:rl:${key}`;
  try {
    const count = await redis.incr(namespaced);
    if (count === 1) {
      await redis.pexpire(namespaced, windowMs);
    }
    if (count > limit) {
      return { ok: false, remaining: 0, backend: "redis" };
    }
    return { ok: true, remaining: limit - count, backend: "redis" };
  } catch {
    // Redis outage must not take auth or webhooks down.
    return memoryLimit(key, limit, windowMs);
  }
}

/** Best-effort client identity behind Vercel's proxy. */
export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}
