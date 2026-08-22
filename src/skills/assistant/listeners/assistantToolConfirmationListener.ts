import { getLogger } from "@std/log";
import type { Filter, Middleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { isAssistantChatAllowed } from "../utilities/routingPolicy.ts";
import {
  ASSISTANT_TOOL_CANCEL_CALLBACK,
  ASSISTANT_TOOL_CONFIRM_CALLBACK,
} from "../utilities/toolConfirmations.ts";
import { describeDeliveredMedia } from "../vision/describeChatMedia.ts";
import { rememberMediaNotes } from "../utilities/rememberMediaNotes.ts";

const logger = () => getLogger();

const editConfirmationMessage = async (
  ctx: BotContext,
  text: string,
): Promise<void> => {
  const chatId = ctx.chat?.id;
  const messageId = ctx.callbackQuery?.message?.message_id;
  if (chatId === undefined || messageId === undefined) return;
  await ctx.api.editMessageText(chatId, messageId, text, {
    reply_markup: { inline_keyboard: [] },
  });
};

export const assistantToolConfirmationListener: Middleware<
  Filter<BotContext, "callback_query:data">
> = async (ctx) => {
  const data = ctx.callbackQuery.data;
  const confirm = data.startsWith(ASSISTANT_TOOL_CONFIRM_CALLBACK);
  const cancel = data.startsWith(ASSISTANT_TOOL_CANCEL_CALLBACK);
  if (!confirm && !cancel) return { handled: false };

  if (
    !ctx.chat ||
    !isAssistantChatAllowed(ctx.chat.id, ctx.configuration)
  ) {
    await ctx.answerCallbackQuery({ text: ctx.t("assistant.tool.notAllowed") });
    return { handled: true };
  }

  const prefix = confirm
    ? ASSISTANT_TOOL_CONFIRM_CALLBACK
    : ASSISTANT_TOOL_CANCEL_CALLBACK;
  const id = data.slice(prefix.length);
  const pending = ctx.session.assistant?.pendingToolConfirmations?.get(id);

  if (!pending || pending.expiresAt <= Date.now()) {
    ctx.session.assistant?.pendingToolConfirmations?.delete(id);
    await ctx.answerCallbackQuery({ text: ctx.t("assistant.tool.expired") });
    try {
      await editConfirmationMessage(ctx, ctx.t("assistant.tool.expired"));
    } catch (error) {
      logger().warn("Failed to edit an expired tool confirmation.", error);
    }
    return { handled: true };
  }

  const callbackMessageId = ctx.callbackQuery.message?.message_id;
  if (
    ctx.from.id !== pending.requesterId || ctx.chat.id !== pending.chatId ||
    (pending.confirmationMessageId !== undefined &&
      callbackMessageId !== pending.confirmationMessageId)
  ) {
    await ctx.answerCallbackQuery({
      text: ctx.t("assistant.tool.wrongUser"),
      show_alert: true,
    });
    return { handled: true };
  }

  ctx.session.assistant?.pendingToolConfirmations.delete(id);

  if (cancel) {
    await ctx.answerCallbackQuery({ text: ctx.t("assistant.tool.cancelled") });
    try {
      await editConfirmationMessage(ctx, ctx.t("assistant.tool.cancelled"));
    } catch (error) {
      logger().warn("Failed to edit a cancelled tool confirmation.", error);
    }
    return { handled: true };
  }

  await ctx.answerCallbackQuery({ text: ctx.t("assistant.tool.running") });
  try {
    const { mediaNotes } = await ctx.skillCommandTools.execute(
      ctx,
      pending.call,
      {
        sourceMessage: pending.sourceMessage,
        onMediaSent: (messages, command) =>
          describeDeliveredMedia(ctx, messages, command),
      },
    );
    // The turn that proposed this command is long finished, so its description
    // has to be filed into the history here or it is lost.
    rememberMediaNotes(ctx, mediaNotes ?? []);
    await editConfirmationMessage(
      ctx,
      ctx.t("assistant.tool.completed", { command: pending.call.command }),
    );
  } catch (error) {
    logger().error(`Confirmed tool /${pending.call.command} failed.`);
    logger().error(error);
    try {
      await editConfirmationMessage(ctx, ctx.t("assistant.tool.failed"));
    } catch (editError) {
      logger().warn("Failed to edit a failed tool confirmation.", editError);
    }
  }

  return { handled: true };
};
