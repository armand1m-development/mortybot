import { assertEquals } from "@std/assert";
import { classifyTurn, shouldThink } from "./thinkingPolicy.ts";

const shape = (
  overrides: Partial<Parameters<typeof classifyTurn>[0]> = {},
) => ({
  usedTools: false,
  toolFailed: false,
  budgetExhausted: false,
  ...overrides,
});

Deno.test("turn classification recognises a plain question", () => {
  assertEquals(classifyTurn(shape()), "new_user_ask");
});

Deno.test("turn classification recognises resuming after tool results", () => {
  assertEquals(
    classifyTurn(shape({ usedTools: true })),
    "mechanical_continuation",
  );
});

Deno.test("turn classification prioritises a failed tool over a plain continuation", () => {
  assertEquals(
    classifyTurn(shape({ usedTools: true, toolFailed: true })),
    "error_continuation",
  );
});

Deno.test("turn classification prioritises the exhausted budget over everything", () => {
  assertEquals(
    classifyTurn(shape({
      usedTools: true,
      toolFailed: true,
      budgetExhausted: true,
    })),
    "final_synthesis",
  );
});

Deno.test("auto mode spends reasoning only on hard turns", () => {
  assertEquals(shouldThink("auto", "new_user_ask"), false);
  assertEquals(shouldThink("auto", "mechanical_continuation"), false);
  assertEquals(shouldThink("auto", "error_continuation"), true);
  assertEquals(shouldThink("auto", "final_synthesis"), true);
});

Deno.test("explicit modes override the classification in both directions", () => {
  assertEquals(shouldThink("on", "new_user_ask"), true);
  assertEquals(shouldThink("off", "final_synthesis"), false);
});
