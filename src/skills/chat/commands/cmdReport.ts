import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import { createMemberMention } from "../../../utilities/createMemberMention.ts";

export const cmdReport: CommandMiddleware<BotContext> = async (ctx) => {
  const repliedMessage = (ctx.msg ?? ctx.update.message).reply_to_message!;
  const reportAuthor = ctx.from;
  const reportedUser = repliedMessage.from;

  if (!reportAuthor) {
    return ctx.reply(
      "Failed to identify the reporting user. This should not happen normally.",
    );
  }

  if (!reportedUser) {
    return ctx.reply(
      "Failed to find the author of the replied message. This should not happen normally.",
    );
  }

  const admins = await ctx.getChatAdministrators();
  const reportedUserMention = createMemberMention(reportedUser, false);
  const groupMessage =
    `Reported ${reportedUserMention} [${reportedUser.id}] to admins.`;

  const mentions = admins.map((admin) => createMemberMention(admin.user)).join(
    " ",
  );

  const message = await ctx.reply(`${mentions} ${groupMessage}`, {
    parse_mode: "Markdown",
    reply_to_message_id: ctx.msg.message_id,
  });

  await ctx.api.editMessageText(ctx.chat.id, message.message_id, groupMessage, {
    parse_mode: "Markdown",
  });
};
