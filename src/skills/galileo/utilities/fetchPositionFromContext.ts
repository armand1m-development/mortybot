import type { CommandContext } from "grammy/context.ts";
import type { BotContext } from "/src/context/mod.ts";
import type { GeoPosition } from "./types.ts";

export const parsePosition = (text: string): GeoPosition => {
  const [latitude, longitude] = text.split(",");

  return {
    latitude: latitude.trim(),
    longitude: longitude.trim(),
  };
};

export const fetchPositionFromContext = (
  ctx: CommandContext<BotContext>,
): GeoPosition => {
  if (ctx.message?.reply_to_message) {
    const replyMessage = ctx.message.reply_to_message;

    if (!replyMessage.location) {
      throw new Error("The reply message should be a location message.");
    }

    const { latitude, longitude } = replyMessage.location;

    return {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    };
  }

  const position = parsePosition(ctx.match.replaceAll("debug", ""));
  const { latitude, longitude } = position;

  if (!latitude || !longitude) {
    throw new Error(
      "You should provide a valid position. Example: `/iss -20.316839,-40.309921`",
    );
  }

  return position;
};
