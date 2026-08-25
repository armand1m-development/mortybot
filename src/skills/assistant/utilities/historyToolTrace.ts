import type { AssistantToolInvocation } from "../httpClients/types.ts";

/**
 * Marker prefix recorded on assistant turns that invoked tools, as documented
 * in the system prompt's tool instructions.
 */
export const HISTORY_TOOL_TRACE_PREFIX = "[tools called this turn:";

/**
 * Prepends a machine-readable note naming the tools a turn invoked to the
 * assistant message stored in session history.
 *
 * History is flattened to plain user/assistant text, so without this note a
 * turn where a bot tool posted images straight into the chat reads — when the
 * model meets it again in a later prompt — as if delivery had been achieved by
 * merely asserting it. The model then imitates the assertion instead of
 * re-invoking the tool, and confidently describes media it never sent. Keeping
 * the cause visible in the transcript makes the imitable behavior the tool
 * call itself.
 */
export const prependHistoryToolTrace = (
  invocations: AssistantToolInvocation[],
  content: string,
): string => {
  if (invocations.length === 0) {
    return content;
  }

  const calls = invocations
    .map((invocation) =>
      invocation.failed ? `${invocation.name} (failed)` : invocation.name
    )
    .join(", ");

  return `${HISTORY_TOOL_TRACE_PREFIX} ${calls}]\n${content}`;
};

/**
 * Whether a model reply carries a tool-trace marker.
 *
 * The marker is prepended by the bot only after a turn's reply is delivered,
 * so a reply that already contains one has forged it — usually to dress up a
 * claimed delivery no tool call backs.
 */
export const containsHistoryToolTraceMarker = (content: string): boolean =>
  content.includes(HISTORY_TOOL_TRACE_PREFIX);

/**
 * Removes forged tool-trace markers, line by line, from a reply.
 */
export const stripHistoryToolTraceMarkers = (content: string): string =>
  content
    .split("\n")
    .filter((line) => !line.includes(HISTORY_TOOL_TRACE_PREFIX))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
