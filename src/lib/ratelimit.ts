// Sliding-window rate limiter. Uses Redis ZSET when REDIS_URL is set;
// falls back to an in-process Map in dev. Returns enough info to set
// 429 Retry-After headers on the caller side.
//
// Keep windows short (≤60s) and limits small. Designed for OTP/auth/search,
// not for heavy traffic shaping.

import IORedis from "ioredis";
import { env } from "@/lib/env";

let _conn: IORedis | null = null;

function redis(): IORedis | null {
  if (!env.REDIS_URL) return null;
  if (!_conn) _conn = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return _conn;
}

const _inMemory = new Map<string, number[]>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Unix-ms timestamp when the window first frees up. */
  resetAt: number;
  /** Seconds the caller should wait before retrying. 0 when ok=true. */
  retryAfterSeconds: number;
};

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  const r = redis();
  if (r) {
    const redisKey = `rl:${key}`;
    await r.zremrangebyscore(redisKey, 0, cutoff);
    const count = await r.zcard(redisKey);
    if (count >= limit) {
      const oldest = await r.zrange(redisKey, 0, 0, "WITHSCORES");
      const oldestMs = oldest[1] ? Number(oldest[1]) : now;
      const resetAt = oldestMs + windowMs;
      return {
        ok: false,
        remaining: 0,
        resetAt,
        retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      };
    }
    // Member must be unique; use timestamp + jitter.
    await r.zadd(redisKey, now, `${now}-${Math.random().toString(36).slice(2, 8)}`);
    await r.expire(redisKey, windowSeconds + 1);
    return {
      ok: true,
      remaining: limit - count - 1,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  }

  // Dev fallback: per-process Map. Resets on server restart.
  const arr = (_inMemory.get(key) ?? []).filter((t) => t > cutoff);
  if (arr.length >= limit) {
    const resetAt = arr[0] + windowMs;
    return {
      ok: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  }
  arr.push(now);
  _inMemory.set(key, arr);
  return {
    ok: true,
    remaining: limit - arr.length,
    resetAt: now + windowMs,
    retryAfterSeconds: 0,
  };
}

/**
 * Derive a stable key from request headers. Prefers the authenticated user id
 * if provided (so a single bad actor can't rotate IPs to bypass), falls back
 * to forwarded client IP, then "anon".
 */
export function clientKey(
  req: Request,
  prefix: string,
  userId?: string | null,
): string {
  if (userId) return `${prefix}:u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || req.headers.get("x-real-ip") || "anon";
  return `${prefix}:ip:${ip}`;
}

/**
 * Build a 429 NextResponse-ready payload. Caller wraps in NextResponse.json(...).
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    ...(result.ok ? {} : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}
