import { getLogger } from "@std/log";
import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { parseHashtags } from "../utilities/parseHashtags.ts";

export const cmdLeave: CommandMiddleware<BotContext> = (ctx) => {
  const hashtags = parseHashtags(ctx.match);

  if (hashtags.length === 0) {
    ctx.reply(ctx.t("hashtags.leaveUsage"));
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

    ctx.reply(ctx.t("hashtags.left", { hashtag }));
  });
};
