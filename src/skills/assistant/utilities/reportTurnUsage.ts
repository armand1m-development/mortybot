import * as Sentry from "sentry";
import { getLogger } from "@std/log";
import { type AssistantTurnUsage, cacheHitRate } from "../httpClients/types.ts";
import type { CacheMissReason } from "./cacheDrift.ts";

const logger = () => getLogger();

export interface TurnUsageReport {
  chatId: number;
  model: string;
  usage: AssistantTurnUsage | undefined;
  missReason: CacheMissReason;
  toolCalls: number;
  durationMs: number;
}

/**
 * Emits one structured log line and one set of Sentry metrics per assistant
 * turn, so prompt-cache behaviour is measurable instead of assumed.
 *
 * The cache-hit rate is only reported when the server actually returned cached
 * token counts; a turn without them contributes nothing rather than pulling the
 * average down with a fabricated zero.
 */
export const reportTurnUsage = (report: TurnUsageReport): void => {
  const { chatId, model, usage, missReason, toolCalls, durationMs } = report;
  const hitRate = cacheHitRate(usage);
  const attributes = { model, missReason };

  logger().info(
    `assistant turn chat=${chatId} model=${model} ` +
      `prompt=${usage?.promptTokens ?? "?"} ` +
      `cached=${usage?.cachedPromptTokens ?? "?"} ` +
      `completion=${usage?.completionTokens ?? "?"} ` +
      `hitRate=${hitRate === undefined ? "?" : hitRate.toFixed(2)} ` +
      `miss=${missReason} calls=${usage?.modelCalls ?? "?"} ` +
      `tools=${toolCalls} duration=${Math.round(durationMs)}ms`,
  );

  Sentry.metrics.distribution("assistant_turn_duration", durationMs, {
    attributes,
    unit: "millisecond",
  });

  if (!usage) {
    return;
  }

  Sentry.metrics.distribution(
    "assistant_prompt_tokens",
    usage.promptTokens,
    { attributes },
  );
  Sentry.metrics.distribution(
    "assistant_completion_tokens",
    usage.completionTokens,
    { attributes },
  );

  if (usage.cachedPromptTokens !== undefined) {
    Sentry.metrics.distribution(
      "assistant_cached_tokens",
      usage.cachedPromptTokens,
      { attributes },
    );
  }
  if (hitRate !== undefined) {
    Sentry.metrics.distribution("assistant_cache_hit_rate", hitRate, {
      attributes,
    });
  }
};
