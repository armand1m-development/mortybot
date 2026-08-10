import { getLogger } from "@std/log";
import { limitedEvaluate } from "../utilities/mathjs.ts";
import type { BotContext } from "/src/context/mod.ts";
import type { CommandMiddleware } from "grammy";

export function isValidMathExpression(expression: string) {
  try {
    const result = limitedEvaluate(expression);
    getLogger().info(result);
    return true;
  } catch (error: unknown) {
    getLogger().error(`Received invalid mathjs expression.`);
    getLogger().error(error);
    return false;
  }
}

export const mustBeValidMathExpression: CommandMiddleware<BotContext> = async (
  ctx,
  next,
) => {
  const expression = ctx.match;

  if (!isValidMathExpression(expression)) {
    await ctx.reply(ctx.t("math.invalidExpression"));
    return;
  }

  return next();
};
