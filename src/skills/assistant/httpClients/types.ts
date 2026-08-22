export interface OpenAiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * One piece of a multimodal message.
 *
 * Only vision requests are ever built out of parts. The conversation history
 * stays plain text on purpose: it is serialized into every subsequent request,
 * so keeping images out of it is what lets the prefix cache, the history token
 * budget and the session file all keep working unchanged.
 */
export type OpenAiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type OpenAiMessageContent = string | OpenAiContentPart[];

export interface OpenAiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: OpenAiMessageContent | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
}

/** The message content as text, ignoring any non-text parts. */
export const messageText = (
  content: OpenAiMessageContent | null | undefined,
): string => {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .filter((part): part is { type: "text"; text: string } =>
      part.type === "text"
    )
    .map((part) => part.text)
    .join("\n");
};

export interface OpenAiTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Token accounting for a single model call.
 *
 * `cachedPromptTokens` is the share of `promptTokens` that SGLang served from
 * its RadixAttention prefix cache instead of prefilling. It is only populated
 * when the server runs with `--enable-cache-report`; otherwise it stays
 * undefined rather than defaulting to zero, so a missing report is never
 * mistaken for a genuine cache miss.
 */
export interface AssistantUsage {
  promptTokens: number;
  completionTokens: number;
  cachedPromptTokens?: number;
}

/** Usage accumulated across every model call made while producing one turn. */
export interface AssistantTurnUsage extends AssistantUsage {
  modelCalls: number;
}

export interface Source {
  url: string;
  title?: string;
}

export interface ToolCallResult {
  text: string;
  sources: Source[];
  deliveredToChat?: boolean;
  confirmationId?: string;
  /**
   * Descriptions of media the tool posted into the chat, written so they still
   * make sense once the images themselves are long gone. Kept apart from
   * `text` because they outlive the turn: `text` is only ever seen by the model
   * mid-turn, while these are folded into the persisted history.
   */
  mediaNotes?: string[];
}

/** One tool invocation made while producing a turn, in call order. */
export interface AssistantToolInvocation {
  name: string;
  failed?: boolean;
  durationMs: number;
}

export interface AssistantTurnResult {
  content: string;
  sources: Source[];
  toolInvocations: AssistantToolInvocation[];
  usage?: AssistantTurnUsage;
  deliveredToChat?: boolean;
  confirmationId?: string;
  /** Descriptions of media the turn's tools posted into the chat, in order. */
  mediaNotes?: string[];
}

/**
 * Share of the prompt that was served from cache, or `undefined` when the
 * server reported no usable numbers.
 *
 * Deliberately never returns 0 for a zero denominator: a silent zero would be
 * averaged into cache-hit dashboards as a real miss and quietly ruin them.
 */
export const cacheHitRate = (
  usage: AssistantUsage | undefined,
): number | undefined => {
  if (!usage || usage.promptTokens <= 0) {
    return undefined;
  }
  if (usage.cachedPromptTokens === undefined) {
    return undefined;
  }
  return usage.cachedPromptTokens / usage.promptTokens;
};
