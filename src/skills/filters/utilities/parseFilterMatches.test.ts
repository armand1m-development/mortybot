import { assertEquals } from "std/testing/asserts.ts";
import { FilterSessionData } from "../sessionData/types.ts";
import { parseFilterMatches } from "./parseFilterMatches.ts";

Deno.test("should match to exact filter", () => {
  const text = "uuuu";

  const testSession: FilterSessionData = {
    filters: new Map(Object.entries({
      uuuu: {
        "filterTrigger": "uuuu",
        "active": true,
        "ownerId": 222222222,
        "message": {
          "caption": "test loud",
        },
        "isLoud": false,
      },
    })),
  };

  const { matches, isExactMatch } = parseFilterMatches(text, testSession);

  assertEquals(matches.size, 0);
  assertEquals(isExactMatch, true);
});

Deno.test("should match to loud filter", () => {
  const text = "this is super nice my friend";

  const testSession: FilterSessionData = {
    filters: new Map(Object.entries({
      nice: {
        "filterTrigger": "nice",
        "active": true,
        "ownerId": 222222222,
        "message": {
          "caption": "test loud",
        },
        "isLoud": true,
      },
    })),
  };

  const { matches, isExactMatch } = parseFilterMatches(text, testSession);

  assertEquals(matches.size, 1);
  assertEquals(isExactMatch, false);
});

Deno.test("should match to multiple loud filters in the same message", () => {
  const text = "buenos dias acorde amigo";

  const testSession: FilterSessionData = {
    filters: new Map(Object.entries({
      "buenos dias": {
        "filterTrigger": "buenos dias",
        "active": true,
        "ownerId": 222222222,
        "message": {
          "caption": "buenos diasitos",
        },
        "isLoud": true,
      },
      "acorde amigo": {
        "filterTrigger": "acorde amigo",
        "active": true,
        "ownerId": 222222222,
        "message": {
          "caption": "amigo meu",
        },
        "isLoud": true,
      },
    })),
  };

  const { matches, isExactMatch } = parseFilterMatches(text, testSession);

  assertEquals(matches.size, 2);
  assertEquals(isExactMatch, false);
});

Deno.test("should not match exact filters found in the middle of a message", () => {
  const text = "this has nice in the middle, but shouldn't trigger a filter";

  const testSession: FilterSessionData = {
    filters: new Map(Object.entries({
      nice: {
        "filterTrigger": "nice",
        "active": true,
        "ownerId": 222222222,
        "message": {
          "caption": "test loud",
        },
        "isLoud": false,
      },
    })),
  };

  const { matches, isExactMatch } = parseFilterMatches(text, testSession);

  assertEquals(matches.size, 0);
  assertEquals(isExactMatch, false);
});

Deno.test("should not match exact filters found in the middle of a message but should match the loud ones", () => {
  const text =
    "this has nice in the middle, but acorde amigo, should trigger a filter";

  const testSession: FilterSessionData = {
    filters: new Map(Object.entries({
      nice: {
        "filterTrigger": "nice",
        "active": true,
        "ownerId": 222222222,
        "message": {
          "caption": "test loud",
        },
        "isLoud": false,
      },
      "acorde amigo": {
        "filterTrigger": "acorde amigo",
        "active": true,
        "ownerId": 222222222,
        "message": {
          "caption": "amigo meu",
        },
        "isLoud": true,
      },
    })),
  };

  const { matches, isExactMatch } = parseFilterMatches(text, testSession);

  assertEquals(matches.size, 1);
  assertEquals(isExactMatch, false);
});

Deno.test("should work with exact filters even if the isLoud key is missing", () => {
  const text = "nice";

  const testSession = {
    filters: new Map(Object.entries({
      nice: {
        "filterTrigger": "nice",
        "active": true,
        "ownerId": 222222222,
        "message": {
          "caption": "test loud",
        },
      },
    })),
  } as FilterSessionData;

  const { matches, isExactMatch } = parseFilterMatches(text, testSession);

  assertEquals(matches.size, 0);
  assertEquals(isExactMatch, true);
});

Deno.test("should only consider active filters", () => {
  const text = "nice";

  const testSession = {
    filters: new Map(Object.entries({
      nice: {
        "filterTrigger": "nice",
        "active": false,
        "ownerId": 222222222,
        "message": {
          "caption": "test loud",
        },
      },
    })),
  } as FilterSessionData;

  const { matches, isExactMatch } = parseFilterMatches(text, testSession);

  assertEquals(matches.size, 0);
  assertEquals(isExactMatch, false);
});
