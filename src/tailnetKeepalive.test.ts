import {
  assert,
  assertEquals,
  assertGreaterOrEqual,
  assertLessOrEqual,
  assertStringIncludes,
} from "@std/assert";
import {
  createTailnetKeepalive,
  createTailnetKeepaliveTargets,
  probeTailnetTarget,
} from "./tailnetKeepalive.ts";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const target = {
  url: "http://100.127.91.6:30000/v1/models",
  apiKey: "sk-1234",
};

Deno.test("probeTailnetTarget requests the target URL with bearer auth", async () => {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fetcher: typeof fetch = (input, init) => {
    calls.push({ url: String(input), init });
    return Promise.resolve(new Response("ok"));
  };

  const result = await probeTailnetTarget(target, { fetcher });

  assertEquals(result, { ok: true, status: 200 });
  assertEquals(calls.length, 1);
  assertEquals(calls[0].url, "http://100.127.91.6:30000/v1/models");
  assertEquals(calls[0].init?.method, "GET");
  assertEquals(calls[0].init?.headers, { Authorization: "Bearer sk-1234" });
});

Deno.test("probeTailnetTarget sends no auth header when the target has no key", async () => {
  const fetcher: typeof fetch = (_input, init) => {
    assertEquals(init?.headers, {});
    return Promise.resolve(new Response("ok"));
  };

  const result = await probeTailnetTarget(
    { url: "http://100.127.91.6:13000/healthz" },
    { fetcher },
  );

  assertEquals(result.ok, true);
});

Deno.test("probeTailnetTarget treats any HTTP response as a successful probe", async () => {
  const result = await probeTailnetTarget(target, {
    fetcher: () => Promise.resolve(new Response("nope", { status: 404 })),
  });

  assertEquals(result, { ok: true, status: 404 });
});

Deno.test("probeTailnetTarget reports network errors as failures instead of throwing", async () => {
  const result = await probeTailnetTarget(target, {
    fetcher: () => Promise.reject(new TypeError("connection refused")),
  });

  assertEquals(result.ok, false);
  assertStringIncludes(result.error ?? "", "connection refused");
});

Deno.test("probeTailnetTarget gives up when the target never answers", async () => {
  const fetcher: typeof fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      );
    });

  const result = await probeTailnetTarget(target, { timeoutMs: 20, fetcher });

  assertEquals(result.ok, false);
});

Deno.test("probeTailnetTarget cancels the response body so the socket stays reusable", async () => {
  let cancelled = false;
  const fetcher: typeof fetch = () =>
    Promise.resolve(
      new Response(
        new ReadableStream<Uint8Array>({
          cancel() {
            cancelled = true;
          },
        }),
      ),
    );

  const result = await probeTailnetTarget(target, { fetcher });

  assertEquals(result.ok, true);
  assert(cancelled);
});

Deno.test("keepalive probes immediately, repeats on the interval, and stops cleanly", async () => {
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.resolve(new Response("ok"));
  };

  const keepalive = createTailnetKeepalive({
    targets: [target],
    intervalMs: 10,
    fetcher,
  });

  keepalive.start();
  // The first probe fires without waiting for a full interval.
  assertEquals(calls, 1);

  await sleep(35);
  assertGreaterOrEqual(calls, 2);

  await keepalive.stop();
  const callsAtStop = calls;
  await sleep(30);
  assertEquals(calls, callsAtStop);
});

Deno.test("keepalive stop awaits an in-flight probe", async () => {
  let settled = false;
  const fetcher: typeof fetch = () =>
    sleep(20).then(() => {
      settled = true;
      return new Response("ok");
    });

  const keepalive = createTailnetKeepalive({
    targets: [target],
    intervalMs: 1_000,
    fetcher,
  });

  keepalive.start();
  await keepalive.stop();

  assert(settled);
});

Deno.test("keepalive skips ticks while a probe is still in flight", async () => {
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return sleep(30).then(() => new Response("ok"));
  };

  const keepalive = createTailnetKeepalive({
    targets: [target],
    intervalMs: 5,
    fetcher,
  });

  keepalive.start();
  await sleep(60);
  await keepalive.stop();

  assertLessOrEqual(calls, 3);
});

Deno.test("keepalive without targets does not schedule probes", async () => {
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.resolve(new Response("ok"));
  };

  const keepalive = createTailnetKeepalive({
    targets: [],
    intervalMs: 5,
    fetcher,
  });
  keepalive.start();
  await sleep(20);
  await keepalive.stop();

  assertEquals(calls, 0);
});

Deno.test("createTailnetKeepaliveTargets derives the LLM probe and appends extras", () => {
  const targets = createTailnetKeepaliveTargets({
    openAiBaseUrl: "http://100.127.91.6:30000/v1/",
    openAiApiKey: "sk-1234",
    tailnetKeepaliveUrls: ["http://100.127.91.6:13000/healthz"],
  });

  assertEquals(targets, [
    { url: "http://100.127.91.6:30000/v1/models", apiKey: "sk-1234" },
    { url: "http://100.127.91.6:13000/healthz" },
  ]);
});

Deno.test("createTailnetKeepaliveTargets skips the LLM probe when no base URL is set", () => {
  const targets = createTailnetKeepaliveTargets({
    openAiBaseUrl: "   ",
    openAiApiKey: "sk-1234",
    tailnetKeepaliveUrls: ["http://100.127.91.6:13000/healthz"],
  });

  assertEquals(targets, [{ url: "http://100.127.91.6:13000/healthz" }]);
});
