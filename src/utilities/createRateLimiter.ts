export interface RateLimitDecision {
  allowed: boolean;
  retryAfterMs: number;
}

export interface RateLimiter {
  consume(key: string): RateLimitDecision;
}

export interface RateLimiterOptions {
  limit: number;
  now?: () => number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export const createRateLimiter = ({
  limit,
  now = Date.now,
  windowMs,
}: RateLimiterOptions): RateLimiter => {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("Rate limit must be a positive integer.");
  }

  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new RangeError("Rate-limit window must be a positive duration.");
  }

  const entries = new Map<string, RateLimitEntry>();
  let nextCleanupAt = 0;

  const removeExpiredEntries = (currentTime: number) => {
    if (currentTime < nextCleanupAt) {
      return;
    }

    for (const [key, entry] of entries) {
      if (currentTime >= entry.resetAt) {
        entries.delete(key);
      }
    }

    nextCleanupAt = currentTime + windowMs;
  };

  return {
    consume(key) {
      const currentTime = now();
      removeExpiredEntries(currentTime);

      const existing = entries.get(key);
      const entry = existing && currentTime < existing.resetAt
        ? existing
        : { count: 0, resetAt: currentTime + windowMs };

      entry.count += 1;
      entries.set(key, entry);

      return {
        allowed: entry.count <= limit,
        retryAfterMs: Math.max(0, entry.resetAt - currentTime),
      };
    },
  };
};
