import type { OpenAiTool } from "../httpClients/types.ts";

/**
 * JSON Schema keywords that annotate a schema without constraining what it
 * accepts. Dropping them shrinks the tool block and removes a source of churn
 * in schemas we do not author, without changing the set of valid arguments.
 *
 * `default` is deliberately kept: it constrains nothing, but models read it as
 * a hint about what to send when an argument is optional.
 */
const ANNOTATION_KEYS = new Set([
  "$comment",
  "$id",
  "$schema",
  "deprecated",
  "example",
  "examples",
  "markdownDescription",
  "readOnly",
  "title",
  "writeOnly",
]);

/**
 * Recursively rebuilds a JSON Schema with its object keys in a fixed order.
 *
 * Arrays are never reordered: `enum`, `required`, `oneOf`, `anyOf` and
 * `prefixItems` all carry meaning in element order.
 */
export const normalizeJsonSchema = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeJsonSchema);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  const source = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const key of Object.keys(source).sort()) {
    if (ANNOTATION_KEYS.has(key)) {
      continue;
    }
    normalized[key] = normalizeJsonSchema(source[key]);
  }

  return normalized;
};

/**
 * Produces a byte-stable tool array.
 *
 * The inference server caches on an exact token prefix and chat templates
 * render tool schemas into the head of the prompt, so any reshuffle of this
 * array silently costs a full prefill on every subsequent request. Tool sets
 * assembled from maps, concurrent MCP handshakes or skill-load order are
 * exactly the kind of thing that reshuffles between restarts, so we sort
 * rather than trust the source order.
 */
export const normalizeOpenAiTools = (tools: OpenAiTool[]): OpenAiTool[] =>
  [...tools]
    .sort((left, right) => left.function.name < right.function.name ? -1 : 1)
    .map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.function.name,
        ...(tool.function.description
          ? { description: tool.function.description }
          : {}),
        parameters: normalizeJsonSchema(tool.function.parameters) as Record<
          string,
          unknown
        >,
      },
    }));
