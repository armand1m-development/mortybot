import * as Sentry from "sentry";
import { getLogger } from "std/log/mod.ts";
import { type Bot, GrammyError, HttpError } from "grammy/mod.ts";
import type { BotContext } from "/src/context/mod.ts";

const logger = () => getLogger();

export const injectGlobalErrorHandler = (bot: Bot<BotContext>) => {
  bot.catch((err) => {
    const ctx = err.ctx;
    logger().error(`Error while handling update ${ctx.update.update_id}:`);
    const error = err.error;
    if (error instanceof GrammyError) {
      logger().error("Error in request:", error.description);
    } else if (error instanceof HttpError) {
      logger().error("Could not contact Telegram:", error);
    } else {
      logger().error("Unknown error:", error);
    }
    Sentry.captureException(err);
  });
};
