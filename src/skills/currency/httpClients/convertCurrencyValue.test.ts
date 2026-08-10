import { assert, assertEquals } from "@std/assert";
import {
  EXCHANGE_RATE_REQUEST_TIMEOUT_MS,
  fetchExchangeRate,
} from "./convertCurrencyValue.ts";

Deno.test("exchange-rate requests attach a bounded timeout signal", async () => {
  const originalFetch = globalThis.fetch;
  let requestSignal: AbortSignal | null | undefined;

  globalThis.fetch = ((_input, init) => {
    requestSignal = init?.signal;
    return Promise.resolve(
      new Response(JSON.stringify({
        result: "success",
        time_next_update_unix: 1,
        base_code: "USD",
        conversion_rates: { USD: 1 },
      })),
    );
  }) as typeof fetch;

  try {
    await fetchExchangeRate({ token: "test-token" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert(requestSignal instanceof AbortSignal);
  assertEquals(requestSignal.aborted, false);
  assertEquals(EXCHANGE_RATE_REQUEST_TIMEOUT_MS, 10_000);
});
