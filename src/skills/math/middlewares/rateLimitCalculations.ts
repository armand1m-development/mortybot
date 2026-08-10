import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { createRateLimiter } from "/src/utilities/createRateLimiter.ts";

export const MATH_RATE_LIMIT = 5;
export const MATH_RATE_LIMIT_WINDOW_MS = 10_000;

const rateLimiter = createRateLimiter({
  limit: MATH_RATE_LIMIT,
  windowMs: MATH_RATE_LIMIT_WINDOW_MS,
});

export const rateLimitCalculations: CommandMiddleware<BotContext> = (
  ctx,
  next,
) => {
  const callerId = ctx.from?.id ?? ctx.msg?.sender_chat?.id ?? ctx.chat?.id;

  if (callerId === undefined) {
    return next();
  }

  const decision = rateLimiter.consume(callerId.toString());
  if (!decision.allowed) {
    return ctx.reply(ctx.t("math.rateLimited"));
  }

  return next();
};
