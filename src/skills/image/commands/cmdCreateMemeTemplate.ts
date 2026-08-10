import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import type { MemeTemplateEntry } from "../sessionData/types.ts";
import { getLogger } from "@std/log";

// deno-lint-ignore no-explicit-any
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
      return ctx.reply(ctx.t("image.templateCreated"));
    } else {
      return ctx.reply(ctx.t("image.invalidTemplateJson"));
    }
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(ctx.t("image.invalidJson"));
  }
};
