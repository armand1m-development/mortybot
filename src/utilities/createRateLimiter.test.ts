import { assertEquals, assertThrows } from "@std/assert";
import { createRateLimiter } from "./createRateLimiter.ts";

Deno.test("rate limiter rejects requests beyond the configured limit", () => {
  let currentTime = 1_000;
  const limiter = createRateLimiter({
    limit: 2,
    now: () => currentTime,
    windowMs: 100,
  });

  assertEquals(limiter.consume("user-1"), {
    allowed: true,
    retryAfterMs: 100,
  });
  assertEquals(limiter.consume("user-1").allowed, true);
  assertEquals(limiter.consume("user-1").allowed, false);

  currentTime = 1_100;
  assertEquals(limiter.consume("user-1"), {
    allowed: true,
    retryAfterMs: 100,
  });
});

Deno.test("rate limiter tracks callers independently", () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: 100 });

  assertEquals(limiter.consume("user-1").allowed, true);
  assertEquals(limiter.consume("user-1").allowed, false);
  assertEquals(limiter.consume("user-2").allowed, true);
});

Deno.test("rate limiter rejects invalid configuration", () => {
  assertThrows(() => createRateLimiter({ limit: 0, windowMs: 100 }));
  assertThrows(() => createRateLimiter({ limit: 1, windowMs: 0 }));
});
