import type { CommandContext } from "grammy/context.ts";
import type { BotContext } from "/src/context/mod.ts";

export const getFileBuffer = async (
  ctx: CommandContext<BotContext>,
  fileId: string,
) => {
  const file = await ctx.api.getFile(fileId);
  const url = file.getUrl();
  const response = await fetch(url);
  return response.arrayBuffer();
};
