import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { createSentMediaCollector } from "./sentMediaCollector.ts";

const fakeApi = (record: string[]) =>
  ({
    sendPhoto: (chatId: number) => {
      record.push(`sendPhoto:${chatId}`);
      return Promise.resolve({ message_id: 1 });
    },
    sendMediaGroup: () =>
      Promise.resolve([{ message_id: 2 }, {
        message_id: 3,
      }]),
    sendMessage: () => {
      record.push("sendMessage");
      return Promise.resolve({ message_id: 4 });
    },
    token: "secret",
  }) as unknown as BotContext["api"];

Deno.test("media a command posts is captured without changing what it sends", async () => {
  const record: string[] = [];
  const collector = createSentMediaCollector();
  const api = collector.wrap(fakeApi(record));

  const photo = await api.sendPhoto(42, "file");
  const group = await api.sendMediaGroup(42, []);
  await api.sendMessage(42, "text");

  assertEquals(photo.message_id, 1);
  assertEquals(group.length, 2);
  assertEquals(record, ["sendPhoto:42", "sendMessage"]);
  assertEquals(collector.messages.map((message) => message.message_id), [
    1,
    2,
    3,
  ]);
});

Deno.test("non-media properties pass straight through", () => {
  const collector = createSentMediaCollector();
  const api = collector.wrap(fakeApi([]));

  assertEquals((api as unknown as { token: string }).token, "secret");
  assertEquals(collector.messages, []);
});
