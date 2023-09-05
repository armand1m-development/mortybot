import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { parseHashtags } from "../utilities/parseHashtags.ts";

export const cmdLeave: CommandMiddleware<BotContext> = (ctx) => {
  const hashtags = parseHashtags(ctx.match);

  if (hashtags.length === 0) {
    ctx.reply(
      "You should provide a hashtag in order to leave one. Example: `/leave_hashtag #games`",
    );
    return;
  }

  hashtags.forEach((hashtag) => {
    const channel = ctx.session.hashtagChannels.get(hashtag);
    const userId = ctx.message!.from.id;

    const oldParticipants = channel?.participants ?? [];

    ctx.session.hashtagChannels.set(hashtag, {
      participants: oldParticipants.filter((id) => id !== userId),
      hashtag,
    });

    getLogger().info(`Removed ${userId} from hashtag channel ${hashtag}`);

    ctx.reply(
      `You're now unsubscribed from the hashtag ${hashtag}.`,
    );
  });
};
