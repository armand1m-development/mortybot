import { assertEquals, assertFalse } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { createTranslator, type Language } from "/src/i18n/mod.ts";
import type { Filter } from "../sessionData/types.ts";
import { cmdDeleteFilter } from "./cmdDeleteFilter.ts";
import { cmdStopFilter } from "./cmdStopFilter.ts";

const filter: Filter = {
  active: true,
  filterTrigger: "!evidence",
  isLoud: false,
  message: {},
  ownerId: 999,
};

const invokeCommand = async (
  command: typeof cmdDeleteFilter,
  filters: Map<string, Filter>,
  match: string,
  language: Language = "pt",
) => {
  const replies: Array<{ text: string; parseMode?: string }> = [];
  const context = {
    from: {
      id: 123,
      is_bot: false,
      first_name: "Morty",
      username: "morty",
    },
    match,
    reply: (text: string, options?: { parse_mode?: string }) => {
      replies.push({ text, parseMode: options?.parse_mode });
      return Promise.resolve({ message_id: 1 });
    },
    session: { filters },
    t: createTranslator(language),
  };
  const handler = command as unknown as (
    context: BotContext,
  ) => Promise<unknown>;

  await handler(context as unknown as BotContext);
  return replies;
};

Deno.test("delete filter removes it and records who deleted it", async () => {
  const filters = new Map([[filter.filterTrigger, filter]]);
  const replies = await invokeCommand(
    cmdDeleteFilter,
    filters,
    filter.filterTrigger,
  );

  assertFalse(filters.has(filter.filterTrigger));
  assertEquals(replies, [{
    text:
      "Só pra deixar registrado: [@morty](tg://user?id=123) foi quem deletou o filtro `!evidence`. Não adianta apagar a evidência depois. Toma vergonha!",
    parseMode: "Markdown",
  }]);
});

Deno.test("stop filter deactivates it and records who stopped it", async () => {
  const filters = new Map([[filter.filterTrigger, filter]]);
  const replies = await invokeCommand(
    cmdStopFilter,
    filters,
    filter.filterTrigger,
  );

  assertEquals(filters.get(filter.filterTrigger)?.active, false);
  assertEquals(replies, [{
    text:
      "Só pra deixar registrado: [@morty](tg://user?id=123) foi quem desativou o filtro `!evidence`. Não adianta apagar a evidência depois. Toma vergonha!",
    parseMode: "Markdown",
  }]);
});

Deno.test("unknown filters keep the existing response without an audit", async () => {
  const replies = await invokeCommand(
    cmdDeleteFilter,
    new Map(),
    "!missing",
    "en",
  );

  assertEquals(replies, [{
    text: "Could not find a filter for the trigger !missing.",
    parseMode: undefined,
  }]);
});
