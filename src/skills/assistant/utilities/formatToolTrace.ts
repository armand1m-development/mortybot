import {
  type AssistantToolInvocation,
  type AssistantTurnUsage,
  cacheHitRate,
} from "../httpClients/types.ts";
import type { CacheMissReason } from "./cacheDrift.ts";

/**
 * Development-only footer listing the tools that produced the answer, so tool
 * routing can be checked from the chat itself without reading the logs. It is
 * appended to the reply only when the bot runs in the development environment.
 */
export const formatToolTrace = (
  invocations: AssistantToolInvocation[],
): string => {
  if (invocations.length === 0) {
    return "*debug: no tools called*";
  }

  const calls = invocations
    .map((invocation) =>
      `${invocation.name}${invocation.failed ? " (failed)" : ""} ${
        Math.round(invocation.durationMs)
      }ms`
    )
    .join(", ");

  return `*debug: ${invocations.length} tool ${
    invocations.length === 1 ? "call" : "calls"
  }: ${calls}*`;
};

const formatTokens = (tokens: number): string =>
  tokens >= 1_000 ? `${(tokens / 1_000).toFixed(1)}k` : `${tokens}`;

/**
 * Development-only footer reporting token usage and how much of the prompt
 * SGLang served from its prefix cache, plus why it missed when it did.
 *
 * A missing cache report is spelled out rather than shown as 0%, so a server
 * started without `--enable-cache-report` is never mistaken for a cold cache.
 */
export const formatUsageTrace = (
  usage: AssistantTurnUsage | undefined,
  missReason?: CacheMissReason,
): string => {
  if (!usage) {
    return "*debug: no token usage reported*";
  }

  const hitRate = cacheHitRate(usage);
  const cached = hitRate === undefined
    ? "cache report off"
    : `${Math.round(hitRate * 100)}% cached`;
  const drift = hitRate !== undefined && hitRate < 0.5 && missReason
    ? `, miss: ${missReason}`
    : "";

  return `*debug: ${
    formatTokens(usage.promptTokens)
  } prompt (${cached}${drift}) · ${
    formatTokens(usage.completionTokens)
  } out · ${usage.modelCalls} model ${
    usage.modelCalls === 1 ? "call" : "calls"
  }*`;
};
