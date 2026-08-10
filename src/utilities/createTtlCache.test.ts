import { assertEquals, assertRejects, assertStrictEquals } from "@std/assert";
import { createTtlCache } from "./createTtlCache.ts";

Deno.test("TTL cache returns a cached value until it expires", async () => {
  let currentTime = 1_000;
  let loadCount = 0;
  const cache = createTtlCache<number>({
    ttlMs: 100,
    now: () => currentTime,
  });
  const load = () => Promise.resolve(++loadCount);

  assertEquals(await cache.get(load), 1);
  currentTime = 1_099;
  assertEquals(await cache.get(load), 1);
  currentTime = 1_100;
  assertEquals(await cache.get(load), 2);
  assertEquals(loadCount, 2);
});

Deno.test("TTL cache deduplicates concurrent loads", async () => {
  let resolveLoad!: (value: string) => void;
  let loadCount = 0;
  const cache = createTtlCache<string>({ ttlMs: 100 });
  const load = () => {
    loadCount++;
    return new Promise<string>((resolve) => {
      resolveLoad = resolve;
    });
  };

  const firstLoad = cache.get(load);
  const secondLoad = cache.get(load);

  assertStrictEquals(firstLoad, secondLoad);
  await Promise.resolve();
  resolveLoad("USD");

  assertEquals(await firstLoad, "USD");
  assertEquals(await secondLoad, "USD");
  assertEquals(loadCount, 1);
});

Deno.test("TTL cache retries after a failed load", async () => {
  let loadCount = 0;
  const cache = createTtlCache<string>({ ttlMs: 100 });
  const load = () => {
    loadCount++;
    return loadCount === 1
      ? Promise.reject(new Error("Exchange API unavailable"))
      : Promise.resolve("USD");
  };

  await assertRejects(() => cache.get(load), Error, "API unavailable");
  assertEquals(await cache.get(load), "USD");
  assertEquals(loadCount, 2);
});

Deno.test("TTL cache can back off after a failed load", async () => {
  let currentTime = 1_000;
  let loadCount = 0;
  const cache = createTtlCache<string>({
    failureTtlMs: 100,
    ttlMs: 1_000,
    now: () => currentTime,
  });
  const load = () => {
    loadCount++;
    return loadCount === 1
      ? Promise.reject(new Error("Exchange API unavailable"))
      : Promise.resolve("USD");
  };

  await assertRejects(() => cache.get(load), Error, "API unavailable");
  await assertRejects(() => cache.get(load), Error, "API unavailable");
  assertEquals(loadCount, 1);

  currentTime = 1_100;
  assertEquals(await cache.get(load), "USD");
  assertEquals(loadCount, 2);
});

Deno.test("TTL cache supports a value-derived duration", async () => {
  let currentTime = 1_000;
  const cache = createTtlCache<number>({
    ttlMs: (value, loadedAt) => value - loadedAt,
    now: () => currentTime,
  });

  assertEquals(await cache.get(() => Promise.resolve(1_200)), 1_200);
  currentTime = 1_199;
  assertEquals(await cache.get(() => Promise.resolve(1_300)), 1_200);
  currentTime = 1_200;
  assertEquals(await cache.get(() => Promise.resolve(1_300)), 1_300);
});
