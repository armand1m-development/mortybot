import { CommandMiddleware } from "grammy/mod.ts";
import { BotContext } from "/src/context/mod.ts";
import { multipleTextReplacer, textReplacer } from "./textReplacer.ts";
import { deleteAndReply } from "./deleteAndReply.ts";

export const createMultipleTextCommand = (
  table: Record<string, string[] | undefined>,
): CommandMiddleware<BotContext> =>
(ctx) => deleteAndReply(ctx, multipleTextReplacer(table, ctx.match));

export const createTextCommand =
  (table: Record<string, string | undefined>): CommandMiddleware<BotContext> =>
  (ctx) => deleteAndReply(ctx, textReplacer(table, ctx.match));
