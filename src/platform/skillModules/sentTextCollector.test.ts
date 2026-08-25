import { assertEquals } from "@std/assert";
import type { Message } from "grammy/types";
import type { BotContext } from "/src/context/mod.ts";
import { createSentTextCollector } from "./sentTextCollector.ts";

const baseApi = () => ({
  sendMessage: () => {
    throw new Error("sendMessage must not reach Telegram in data mode");
  },
  sendPhoto: () => Promise.resolve({ message_id: 5 } as Message),
  deleteMessage: () => Promise.resolve(true),
});

Deno.test("sent text collector records sendMessage text without sending", async () => {
  const collector = createSentTextCollector();
  const api = collector.wrap(baseApi() as unknown as BotContext["api"]);

  const first = await api.sendMessage(1, "- kick\n- hug" as never);
  const second = await api.sendMessage(1, "that is all" as never);

  assertEquals(collector.texts, ["- kick\n- hug", "that is all"]);
  assertEquals(first.message_id, -1);
  assertEquals(second.message_id, -1);
});

Deno.test("sent text collector lets every other API call through", async () => {
  const collector = createSentTextCollector();
  const api = collector.wrap(baseApi() as unknown as BotContext["api"]);

  assertEquals((await api.sendPhoto(1, "photo" as never)).message_id, 5);
  assertEquals(await api.deleteMessage(1, 2 as never), true);
  assertEquals(collector.texts, []);
});
