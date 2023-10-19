import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { parsePosition } from "../utilities/parsePosition.ts";
import { formatIssPassMessage } from "../utilities/formatIssPassMessage.ts";

export const nextIssPasses: CommandMiddleware<BotContext> = async (ctx) => {
  const position = parsePosition(ctx.match);
  const { latitude, longitude } = position;

  if (!latitude || !longitude) {
    ctx.reply(
      "You should provide a valid position. Example: `/iss -20.316839,-40.309921`",
    );
    return;
  }

  const { passes } = await ctx.n2yoApi.fetchIssPasses(position);

  ctx.reply(formatIssPassMessage(passes));
};
