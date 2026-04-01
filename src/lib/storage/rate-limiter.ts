import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

let _limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (_limiter) return _limiter;

  const redis = getRedis();
  if (!redis) return null;

  const maxRequests = parseInt(process.env.RATE_LIMIT_REQUESTS ?? "20", 10);
  const windowSec = parseInt(
    process.env.RATE_LIMIT_WINDOW_SECONDS ?? "60",
    10
  );

  _limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
    prefix: "rl:slack",
  });

  return _limiter;
}

export async function checkRateLimit(
  identifier: string
): Promise<{ success: boolean }> {
  const limiter = getLimiter();
  if (!limiter) return { success: true };
  return limiter.limit(identifier);
}
