import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import type { GeoPosition } from "../utilities/types.ts";
import { formatIssPassMessage } from "../utilities/formatIssPassMessage.ts";
import { fetchPositionFromContext } from "../utilities/fetchPositionFromContext.ts";

export const nextIssPasses: CommandMiddleware<BotContext> = async (ctx) => {
  let position: GeoPosition;

  try {
    position = fetchPositionFromContext(ctx);
  } catch (err) {
    ctx.reply(err.message);
    return;
  }

  const response = await ctx.n2yoApi.fetchIssPasses(position);

  if (ctx.message?.text.includes("debug")) {
    ctx.reply(JSON.stringify(response, null, 2));
  }

  ctx.reply(formatIssPassMessage(position, response.passes));
};
