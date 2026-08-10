import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { createTranslator } from "/src/i18n/mod.ts";
import { cmdTerceiraPonteNow } from "./cmdTerceiraPonteNow.ts";

Deno.test("Third Bridge command removes loading feedback after one uncaptained album", async () => {
  const events: string[] = [];
  const context = {
    api: {
      deleteMessage: (chatId: number, messageId: number) => {
        events.push(`delete:${chatId}:${messageId}`);
        return Promise.resolve(true);
      },
      sendChatAction: () => {
        events.push("chat-action");
        return Promise.resolve(true);
      },
    },
    chat: { id: 123 },
    reply: (text: string) => {
      events.push(`reply:${text}`);
      return Promise.resolve({ message_id: 456 });
    },
    replyWithMediaGroup: (
      media: Array<{ caption?: string; type: string }>,
      options?: unknown,
    ) => {
      const hasCaption = media.some(({ caption }) => caption !== undefined);
      events.push(
        `album:${media.length}:${hasCaption ? "caption" : "no-caption"}:` +
          `${options === undefined ? "no-options" : "options"}`,
      );
      return Promise.resolve([{ message_id: 789 }]);
    },
    rodosolApi: {
      fetchThirdBridgeImages: () => {
        events.push("fetch");
        return Promise.resolve([
          {
            alt: "Subida Vitória",
            dataUrl: "data:image/jpeg;base64,/9j/2Q==",
          },
          {
            alt: "Descida Vitória",
            dataUrl: "data:image/jpeg;base64,/9j/2Q==",
          },
        ]);
      },
    },
    t: createTranslator("en"),
  };

  const command = cmdTerceiraPonteNow as unknown as (
    context: BotContext,
  ) => Promise<unknown>;
  await command(context as unknown as BotContext);

  assertEquals(events, [
    "reply:Loading photos...",
    "chat-action",
    "fetch",
    "album:2:no-caption:no-options",
    "delete:123:456",
  ]);
});
