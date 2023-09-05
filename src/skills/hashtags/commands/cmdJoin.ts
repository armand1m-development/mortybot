import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { parseHashtags } from "../utilities/parseHashtags.ts";

export const cmdJoin: CommandMiddleware<BotContext> = (ctx) => {
  const hashtags = parseHashtags(ctx.match);

  if (hashtags.length === 0) {
    ctx.reply(
      "You should provide a hashtag in order to join one. Example: `/join_hashtag #games`",
    );
    return;
  }

  hashtags.forEach((hashtag) => {
    const channel = ctx.session.hashtagChannels.get(hashtag);

    const userId = ctx.message!.from.id;

    if (channel?.participants?.includes(userId)) {
      ctx.reply(
        `You're already registered to the hashtag ${hashtag}`,
      );
      return;
    }

    const oldParticipants = channel?.participants ?? [];

    ctx.session.hashtagChannels.set(hashtag, {
      participants: [...oldParticipants, userId],
      hashtag,
    });

    getLogger().info(`Registered ${userId} into tag ${hashtag}`);

    ctx.reply(
      `You're registered to the hashtag ${hashtag}. Use "/leave_hashtag ${hashtag}" to stop unsubscribe.`,
    );
  });
};
