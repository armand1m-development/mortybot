import type { CommandContext } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import type { GeoPosition } from "./types.ts";

export type PositionInputErrorCode = "replyMustBeLocation" | "positionRequired";

export class PositionInputError extends Error {
  constructor(readonly code: PositionInputErrorCode) {
    super(code);
    this.name = "PositionInputError";
  }
}

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
      throw new PositionInputError("replyMustBeLocation");
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
    throw new PositionInputError("positionRequired");
  }

  return position;
};
