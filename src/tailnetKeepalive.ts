import { getLogger } from "@std/log";
import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";

const logger = () => getLogger();

export const DEFAULT_TAILNET_KEEPALIVE_INTERVAL_MS = 25_000;
export const DEFAULT_TAILNET_KEEPALIVE_TIMEOUT_MS = 5_000;

export interface TailnetProbeTarget {
  url: string;
  apiKey?: string;
}

export interface TailnetProbeResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export interface TailnetKeepalive {
  start(): void;
  stop(): Promise<void>;
}

export interface TailnetKeepaliveOptions {
  targets: TailnetProbeTarget[];
  intervalMs?: number;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

/**
 * Issues one lightweight GET against a tailnet service. Any HTTP answer, even
 * a 404, counts as success: the request crossed the tunnel, which is all the
 * keepalive needs to keep the WireGuard path to the host warm. Only network
 * errors and timeouts mean the probe failed.
 */
export const probeTailnetTarget = async (
  target: TailnetProbeTarget,
  options?: { timeoutMs?: number; fetcher?: typeof fetch },
): Promise<TailnetProbeResult> => {
  const { timeoutMs = DEFAULT_TAILNET_KEEPALIVE_TIMEOUT_MS, fetcher = fetch } =
    options ?? {};

  try {
    const response = await fetcher(target.url, {
      method: "GET",
      headers: target.apiKey
        ? { Authorization: `Bearer ${target.apiKey}` }
        : {},
      signal: AbortSignal.timeout(timeoutMs),
    });

    // The body is never read; cancel it so the pooled socket is returned for
    // reuse instead of being discarded with the response.
    try {
      await response.body?.cancel();
    } catch {
      // A body that refuses to cancel does not change the probe outcome.
    }

    return { ok: true, status: response.status };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
};

/**
 * Builds the probe list from configuration: the LLM endpoint (shared host for
 * every tailnet service in this deployment, so it warms the path for all of
 * them) plus any explicitly configured extra URLs.
 */
export const createTailnetKeepaliveTargets = (
  configuration: Pick<
    Configuration,
    "openAiBaseUrl" | "openAiApiKey" | "tailnetKeepaliveUrls"
  >,
): TailnetProbeTarget[] => {
  const targets: TailnetProbeTarget[] = [];

  const baseUrl = configuration.openAiBaseUrl.trim();
  if (baseUrl !== "") {
    targets.push({
      url: `${baseUrl.replace(/\/+$/, "")}/models`,
      apiKey: configuration.openAiApiKey,
    });
  }

  for (const url of configuration.tailnetKeepaliveUrls) {
    targets.push({ url });
  }

  return targets;
};

/**
 * Keeps the tailnet path to the configured hosts warm by probing them on a
 * fixed interval, so the first real request after an idle period does not pay
 * for re-establishing the WireGuard session through the DERP relay.
 */
export const createTailnetKeepalive = ({
  targets,
  intervalMs = DEFAULT_TAILNET_KEEPALIVE_INTERVAL_MS,
  timeoutMs = DEFAULT_TAILNET_KEEPALIVE_TIMEOUT_MS,
  fetcher = fetch,
}: TailnetKeepaliveOptions): TailnetKeepalive => {
  let timer: ReturnType<typeof setInterval> | null = null;
  let inFlight: Promise<void> | null = null;
  let busy = false;
  /** undefined until the first probe settles; changes are logged once. */
  let healthy: boolean | undefined;

  const runProbes = async () => {
    const failures: string[] = [];

    for (const target of targets) {
      const result = await probeTailnetTarget(target, { timeoutMs, fetcher });
      if (!result.ok) {
        failures.push(`${target.url}: ${result.error}`);
      }
    }

    if (failures.length > 0 && healthy !== false) {
      logger().warn(`Tailnet keepalive probe failing: ${failures.join("; ")}`);
    } else if (failures.length === 0 && healthy === false) {
      logger().info("Tailnet keepalive probes recovered.");
    }
    healthy = failures.length === 0;
  };

  const tick = () => {
    if (busy || timer === null) {
      return;
    }
    busy = true;
    inFlight = runProbes().catch(() => {}).finally(() => {
      busy = false;
    });
  };

  return {
    start() {
      if (timer !== null) {
        return;
      }
      if (targets.length === 0) {
        logger().debug(
          "Tailnet keepalive has no probe targets configured; not started.",
        );
        return;
      }

      timer = setInterval(tick, intervalMs);
      // Probe once right away so the path is warm before the first request.
      tick();
    },
    async stop() {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      if (inFlight) {
        await inFlight;
        inFlight = null;
      }
    },
  };
};
