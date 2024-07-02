import { getLogger } from "std/log/mod.ts";
import { limitedEvaluate } from "../utilities/mathjs.ts";
import type { BotContext } from "/src/context/mod.ts";
import type { CommandMiddleware } from "grammy/mod.ts";

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
    await ctx.reply(
      `The provided text message is not a valid mathjs expression. Refer to https://mathjs.org/ for more information.`,
    );
    return;
  }

  return next();
};
