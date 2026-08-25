import { assertEquals } from "@std/assert";
import {
  containsHistoryToolTraceMarker,
  HISTORY_TOOL_TRACE_PREFIX,
  prependHistoryToolTrace,
  stripHistoryToolTraceMarkers,
} from "./historyToolTrace.ts";

Deno.test("history tool trace leaves tool-less turns unchanged", () => {
  assertEquals(
    prependHistoryToolTrace([], "Nothing to see here."),
    "Nothing to see here.",
  );
});

Deno.test("history tool trace lists every call in order", () => {
  assertEquals(
    prependHistoryToolTrace(
      [
        { name: "bot_tp_now", durationMs: 63_212 },
        { name: "search_web", durationMs: 800 },
      ],
      "The camera feed has been delivered.",
    ),
    "[tools called this turn: bot_tp_now, search_web]\nThe camera feed has been delivered.",
  );
});

Deno.test("history tool trace marks failed calls", () => {
  assertEquals(
    prependHistoryToolTrace(
      [{ name: "search_web", failed: true, durationMs: 7 }],
      "The search failed.",
    ),
    "[tools called this turn: search_web (failed)]\nThe search failed.",
  );
});

Deno.test("history tool trace survives history sanitization", () => {
  // sanitizeHistory keeps string content as-is; this pins the contract that
  // the marker is plain string content, not a structured payload.
  const traced = prependHistoryToolTrace(
    [{ name: "bot_calc", durationMs: 1 }],
    "Imagens enviadas.",
  );
  assertEquals(typeof traced, "string");
  assertEquals(traced.startsWith(HISTORY_TOOL_TRACE_PREFIX), true);
});

Deno.test("a reply carrying the marker text is detected as forged", () => {
  // Reproduces the observed forgery: the model opens its reply with a marker
  // for a tool it never called, plus an analysis from memory.
  const forgedReply = [
    "[tools called this turn: bot_tp_now]",
    "The live Third Bridge cameras are now posted.",
    "",
    "Traffic is light to moderate in both directions.",
  ].join("\n");

  assertEquals(containsHistoryToolTraceMarker(forgedReply), true);
  assertEquals(
    containsHistoryToolTraceMarker("An honest reply with no marker."),
    false,
  );
});

Deno.test("stripping removes marker lines but keeps the prose", () => {
  assertEquals(
    stripHistoryToolTraceMarkers(
      "[tools called this turn: bot_tp_now]\nThe cameras are now posted.\n\nAnalysis follows.",
    ),
    "The cameras are now posted.\n\nAnalysis follows.",
  );
  // A marker mid-prose still removes only its own line.
  assertEquals(
    stripHistoryToolTraceMarkers(
      "One\n[tools called this turn: bot_calc]\nTwo",
    ),
    "One\nTwo",
  );
});
