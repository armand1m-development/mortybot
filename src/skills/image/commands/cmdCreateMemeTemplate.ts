import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { getLogger } from "std/log/mod.ts";
import { MemeTemplateEntry } from "../sessionData/types.ts";

function isValidMemeTemplateEntry(obj: any): obj is MemeTemplateEntry {
  return (
    typeof obj === "object" &&
    obj !== null &&
    obj.name &&
    obj.url &&
    typeof obj.params === "object" &&
    obj.params !== null
  );
}

export const cmdCreateMemeTemplate: CommandMiddleware<BotContext> = (ctx) => {
  try {
    const serialized = JSON.parse(ctx.match) as MemeTemplateEntry;

    if (isValidMemeTemplateEntry(serialized)) {
      ctx.session.memeTemplates.set(serialized.name, serialized);
      return ctx.reply("Meme template create successfully.");
    } else {
      return ctx.reply("Please send a valid MemeTemplateEntry JSON object.");
    }
  } catch (error) {
    getLogger().error(error);
    return ctx.reply("Please send a valid JSON object.");
  }
};
