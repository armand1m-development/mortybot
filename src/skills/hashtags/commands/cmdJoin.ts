import { getLogger } from "@std/log";
import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { parseHashtags } from "../utilities/parseHashtags.ts";

export const cmdJoin: CommandMiddleware<BotContext> = (ctx) => {
  const hashtags = parseHashtags(ctx.match);

  if (hashtags.length === 0) {
    ctx.reply(ctx.t("hashtags.joinUsage"));
    return;
  }

  hashtags.forEach((hashtag) => {
    const channel = ctx.session.hashtagChannels.get(hashtag);

    const userId = ctx.message!.from.id;

    if (channel?.participants?.includes(userId)) {
      ctx.reply(ctx.t("hashtags.alreadyJoined", { hashtag }));
      return;
    }

    const oldParticipants = channel?.participants ?? [];

    ctx.session.hashtagChannels.set(hashtag, {
      participants: [...oldParticipants, userId],
      hashtag,
    });

    getLogger().info(`Registered ${userId} into tag ${hashtag}`);

    ctx.reply(ctx.t("hashtags.joined", { hashtag }));
  });
};
