import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { parseHashtags } from "../utilities/parseHashtags.ts";
import { BotContext } from "/src/context/mod.ts";

export const tagMentionListener: Middleware<
  Filter<BotContext, "message:text">
> = (ctx) => {
  const hashtags = parseHashtags(ctx.msg.text);
};
