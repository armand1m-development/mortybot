import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { parseHashtags } from "../utilities/parseHashtags.ts";

export const cmdJoin: CommandMiddleware<BotContext> = (ctx) => {
  const hashtags = parseHashtags(ctx.match);

  if (hashtags.length === 0) {
    ctx.reply(
      "You should provide a hashtag in order to join one. Example: `/!myfilter`",
    );
    return;
  }

  hashtags.forEach((tagName) => {
    const channel = ctx.session.tagChannels.get(tagName);
    const userId = ctx.message!.from.id;

    if (channel?.participants.includes(userId)) {
      ctx.reply(
        `You're already registered to the channel ${tagName}`,
      );
      return;
    }

    const oldParticipants = channel?.participants ?? [];

    ctx.session.tagChannels.set(tagName, {
      participants: [...oldParticipants, userId],
      tagName,
    });

    getLogger().info(`Registered ${userId} into tag ${tagName}`);
  });
};
