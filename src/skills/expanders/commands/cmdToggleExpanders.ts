import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdToggleExpanders: CommandMiddleware<BotContext> = async (ctx) => {
  // TODO: toggle session object to enable or disable expanders
};
