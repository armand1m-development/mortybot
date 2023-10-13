import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { parsePosition } from "../utilities/parsePosition.ts";
import { GeoPosition } from "./types.ts";
import { formatIssPassMesage } from "../utilities/formatIssPassMesage.ts";

export const nextIssPasses: CommandMiddleware<BotContext> = async (ctx) => {
  const position: GeoPosition = parsePosition(ctx.match);
  const { latitude, longitude } = position;

  if (!latitude || !longitude) {
    ctx.reply(
      "You should provide a valid postion. Example: `/iss -20.316839,-40.309921`"
    );
    return;
  }

  const { passes, info } = await ctx.n2yoApi.fetchIssPasses(position);

  if (info.passescount === 0) {
    ctx.reply("Iss will not pass visible in your sky for the next 3 days :(");
  }

  ctx.reply(formatIssPassMesage(passes));
};
