import type { CommandMiddleware } from "grammy";
import { getChunks } from "/src/utilities/array/getChunks.ts";
import type { BotContext } from "/src/context/mod.ts";
import type { MemeTemplateEntry } from "../sessionData/types.ts";

/**
 * Renders one template as a listing line. Slot names are what `/create_meme`
 * takes as query parameters, so the listing doubles as usage instructions; a
 * trailing `?` marks the slots a meme may omit.
 */
const formatTemplate = (template: MemeTemplateEntry): string => {
  const slots = template.params
    .map((param) => param.fontParams.optional ? `${param.name}?` : param.name)
    .join(", ");

  return `- ${template.name} (slots: ${slots})`;
};

export const cmdListMemeTemplates: CommandMiddleware<BotContext> = async (
  ctx,
) => {
  const entries = [...ctx.session.memeTemplates.values()];

  if (entries.length === 0) {
    await ctx.reply(ctx.t("image.noTemplates"));
    return;
  }

  const chunkedEntries = getChunks(entries, 100);

  for (const entrySet of chunkedEntries) {
    const message = entrySet.map(formatTemplate).join("\n");

    await ctx.reply(message);
  }
};
