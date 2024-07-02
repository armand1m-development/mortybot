import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import { format, limitedEvaluate } from "../utilities/mathjs.ts";

export const cmdCalculate: CommandMiddleware<BotContext> = (ctx) => {
  try {
    const result = limitedEvaluate(ctx.match);

    if (typeof result === "object") {
      return ctx.reply(format(result, {
        notation: "fixed",
        precision: 2,
      }));
    }

    return ctx.reply(result);
  } catch (err: unknown) {
    const error = err as Error;
    return ctx.reply(error.message);
  }
};
