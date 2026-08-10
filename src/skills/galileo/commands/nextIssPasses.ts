import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import type { GeoPosition } from "../utilities/types.ts";
import { formatIssPassMessage } from "../utilities/formatIssPassMessage.ts";
import {
  fetchPositionFromContext,
  PositionInputError,
  type PositionInputErrorCode,
} from "../utilities/fetchPositionFromContext.ts";
import type { TranslationKey } from "/src/i18n/mod.ts";

const inputErrorTranslationKeys = {
  positionRequired: "galileo.positionRequired",
  replyMustBeLocation: "galileo.replyMustBeLocation",
} as const satisfies Record<PositionInputErrorCode, TranslationKey>;

export const nextIssPasses: CommandMiddleware<BotContext> = async (ctx) => {
  let position: GeoPosition;

  try {
    position = fetchPositionFromContext(ctx);
  } catch (err) {
    const message = err instanceof PositionInputError
      ? ctx.t(inputErrorTranslationKeys[err.code])
      : String(err);
    ctx.reply(message);
    return;
  }

  const response = await ctx.n2yoApi.fetchIssPasses(position);

  if (ctx.message?.text.includes("debug")) {
    ctx.reply(JSON.stringify(response, null, 2));
  }

  ctx.reply(
    formatIssPassMessage(position, response.passes, ctx.t, ctx.language),
  );
};
