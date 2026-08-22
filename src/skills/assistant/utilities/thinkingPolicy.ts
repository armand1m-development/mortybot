/** How much latitude the assistant has to spend reasoning tokens. */
export type AssistantThinkingMode = "off" | "auto" | "on";

/**
 * What a model call is structurally being asked to do.
 *
 * Classified from the shape of the conversation rather than from its content,
 * so the decision is cheap, deterministic, and never depends on guessing what
 * the user meant.
 */
export type TurnKind =
  | "new_user_ask"
  | "mechanical_continuation"
  | "error_continuation"
  | "final_synthesis";

export interface TurnShape {
  /** True once at least one tool has run during this turn. */
  usedTools: boolean;
  /** True when any tool call in this turn failed. */
  toolFailed: boolean;
  /** True on the call made after the tool-iteration budget ran out. */
  budgetExhausted: boolean;
}

export const classifyTurn = (shape: TurnShape): TurnKind => {
  if (shape.budgetExhausted) {
    return "final_synthesis";
  }
  if (shape.toolFailed) {
    return "error_continuation";
  }
  if (shape.usedTools) {
    return "mechanical_continuation";
  }
  return "new_user_ask";
};

/**
 * Decides whether a call should be allowed to produce reasoning tokens.
 *
 * Reasoning tokens are pure decode cost: they are generated one at a time, they
 * are never served from the prompt cache, and the user never sees them. A group
 * chat answering "what's the weather" does not need them; recovering from a
 * failed tool call or synthesizing several tool results does.
 *
 * `auto` may only ever lower the effort relative to the model's default. It
 * never turns thinking on where the model would not have used it anyway, so a
 * misclassification can cost brevity but never correctness of the wiring.
 */
export const shouldThink = (
  mode: AssistantThinkingMode,
  kind: TurnKind,
): boolean => {
  if (mode === "on") {
    return true;
  }
  if (mode === "off") {
    return false;
  }
  return kind === "error_continuation" || kind === "final_synthesis";
};
