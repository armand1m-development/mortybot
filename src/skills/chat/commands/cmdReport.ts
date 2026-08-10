import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { createMemberMention } from "../../../utilities/createMemberMention.ts";

export const cmdReport: CommandMiddleware<BotContext> = async (ctx) => {
  const repliedMessage = (ctx.msg ?? ctx.update.message).reply_to_message!;
  const reportAuthor = ctx.from;
  const reportedUser = repliedMessage.from;

  if (!reportAuthor) {
    return ctx.reply(ctx.t("chat.report.reporterUnknown"));
  }

  if (!reportedUser) {
    return ctx.reply(ctx.t("chat.report.authorUnknown"));
  }

  const admins = await ctx.getChatAdministrators();
  const reportedUserMention = createMemberMention(reportedUser, false);
  const groupMessage = ctx.t("chat.report.reported", {
    user: reportedUserMention,
    userId: reportedUser.id,
  });

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
