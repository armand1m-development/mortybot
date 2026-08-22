import { getLogger } from "@std/log";
import { InlineKeyboard, InputFile, type Middleware } from "grammy";
import type { Filter } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import type { Language } from "/src/i18n/mod.ts";
import { messageText } from "../httpClients/types.ts";
import type { OpenAiMessage, Source } from "../httpClients/types.ts";
import { extractBotMention } from "../utilities/extractBotMention.ts";
import { chunkMessage } from "../utilities/chunkMessage.ts";
import {
  markdownToTelegramHtml,
  telegramHtmlToPlainText,
} from "../utilities/telegramHtml.ts";
import { loadMarkdownDoc } from "../utilities/loadMarkdownDoc.ts";
import { buildReplyContext } from "../utilities/buildReplyContext.ts";
import { createProgressTicker } from "../utilities/progressTicker.ts";
import { editProgressMessage } from "../utilities/editProgressMessage.ts";
import { sanitizeHistory } from "../utilities/sanitizeHistory.ts";
import { evictHistory } from "../utilities/evictHistory.ts";
import {
  formatToolTrace,
  formatUsageTrace,
} from "../utilities/formatToolTrace.ts";
import { fingerprint, getCacheDriftTracker } from "../utilities/cacheDrift.ts";
import { reportTurnUsage } from "../utilities/reportTurnUsage.ts";
import { extractCodeFiles } from "../utilities/extractCodeFiles.ts";
import {
  type AssistantResponseLanguage,
  buildAssistantLanguageDirective,
} from "../utilities/assistantLanguage.ts";
import {
  buildAssistantEmojiDirective,
  defaultAssistantEmojisEnabled,
  removeEmojis,
} from "../utilities/assistantEmojis.ts";
import { buildAssistantPreferencesDirective } from "../utilities/assistantPreferences.ts";
import { createInitialAssistantState } from "../sessionData/getInitialAssistantSessionData.ts";
import {
  isAssistantChatAllowed,
  isAssistantMessageAddressedToBot,
} from "../utilities/routingPolicy.ts";
import {
  ASSISTANT_TOOL_CANCEL_CALLBACK,
  ASSISTANT_TOOL_CONFIRM_CALLBACK,
} from "../utilities/toolConfirmations.ts";
import {
  createAssistantTrajectoryRecorder,
  serializeTrajectoryError,
} from "../trajectory/recorder.ts";
import type { AssistantTrajectoryRecorder } from "../trajectory/types.ts";
import { collectMessageMedia } from "../vision/collectMessageMedia.ts";
import {
  collectAlbumAttachments,
  getAlbumBuffer,
} from "../vision/albumBuffer.ts";
import { describeIncomingMedia } from "../vision/describeChatMedia.ts";
import { appendMediaNotes } from "../vision/mediaMemory.ts";
import type { MediaAttachment } from "../vision/types.ts";

const logger = () => getLogger();

/**
 * How often the progress message is rewritten while the answer streams in.
 * Telegram rate-limits edits, and an edit already in flight is skipped, so this
 * is a floor rather than a guarantee.
 */
const PROGRESS_INTERVAL_MS = 2000;

/** Telegram rejects messages over 4096 characters. */
const PROGRESS_PREVIEW_LIMIT = 3900;

/**
 * Static tool-usage guidance.
 *
 * Deliberately does not enumerate the tools. Every name, description and
 * parameter schema already travels in the request's `tools` array, so listing
 * them here paid for the whole inventory twice — and it put the one
 * chat-type-dependent chunk of the prompt in front of several thousand static
 * tokens, where any change to it invalidated everything after.
 *
 * Keep this text byte-stable: the inference server caches on an exact prefix,
 * so editing these strings is a cache-busting change for every chat.
 */
const TOOL_USAGE_INSTRUCTIONS = [
  "## Tools",
  "### When to use tools",
  "- When the user asks Morty to perform one of its documented bot commands, call the matching `bot_` tool instead of merely telling them which slash command to type.",
  "- Bot tools deliver their native Telegram output directly, including photos and media groups. After a successful bot tool, reply with only a brief contextual confirmation.",
  "- Never claim a bot command ran, or that its output was delivered, unless you called its tool in this same turn. If you made no tool call, nothing was posted.",
  "- State-changing bot tools do not run immediately. If a tool reports that approval is required, briefly explain the pending action and tell the user to use the Confirm or Cancel button.",
  "- ALWAYS call a search tool when the user asks you to 'search the web', 'look this up', 'find out', or anything implying they want you to retrieve external information.",
  "- ALWAYS call a search tool for questions about current events, recent news, live scores, prices, weather, schedules, or anything that changes over time.",
  "- If you are uncertain whether your training data covers the topic, search instead of guessing.",
  "- Do NOT search for: general knowledge you already know well (e.g. 'what is gravity'), opinions, or questions about this bot's own commands (use the skills doc below).",
  "",
  "### After using tools",
  "- Incorporate the results into your answer naturally.",
  "- Cite sources at the end of your reply when you relied on search results.",
  "- If the search returned no useful results, say so honestly rather than making something up.",
].join("\n");

/**
 * Length discipline.
 *
 * Output tokens are the assistant's real budget: unlike the prompt they are
 * generated one at a time and never served from cache, so a rambling answer
 * costs far more wall-clock than a long-but-cached system prompt.
 *
 * Deliberately narrow. SOUL.md already asks for the answer first and for simple
 * answers to stay concise; repeating that here would only spend tokens saying
 * the same thing twice. These are the wasteful habits it does not cover.
 *
 * Keep this text byte-stable: editing it invalidates the prefix cache for every
 * chat.
 */
const RESPONSE_LENGTH_INSTRUCTIONS = [
  "## Length",
  "- No preamble and no postamble. Do not announce what you are about to do, and do not close by summarising what you just said.",
  "- Do not restate the question, and do not repeat content that is already visible in the chat.",
  "- When a bot tool has already delivered its output to the chat, never reproduce it — acknowledge it in one line.",
].join("\n");

/**
 * How to read the bracketed media notes.
 *
 * The model never receives an image: a vision pass turns everything posted in
 * the chat into text first, so the notes are its only account of what people
 * are looking at. Without this it either refuses ("I can't see images") or
 * narrates the machinery, both of which read as broken to the group.
 *
 * Keep this text byte-stable: editing it invalidates the prefix cache for every
 * chat.
 */
const MEDIA_INSTRUCTIONS = [
  "## Images and video",
  "- Photos, videos, GIFs and stickers in this chat reach you as bracketed descriptions written by a vision pass. Treat them as your own view of the media.",
  "- Answer the question directly. Never say you cannot see images, never mention the description, the brackets, or the vision pass, and never quote a description back at the user.",
  "- The description is all you get. If it does not cover what was asked, say what you cannot make out instead of inventing it.",
  "- A bracketed note about media a bot command posted describes what the user is looking at right now. When it covers what they actually asked, answer from it instead of only confirming that the command ran.",
].join("\n");

const CODE_FILE_INSTRUCTIONS = [
  "## Code responses",
  "When the user asks you to create, write, or modify code, put every complete file in its own fenced code block.",
  "Immediately before each code block, write `File: relative/path.ext` on a separate line.",
  "Keep any short explanation outside the code blocks. Never place generated file contents outside a fenced code block.",
].join("\n");

const FORMATTING_INSTRUCTIONS = [
  "## Formatting",
  "Replies are delivered to Telegram, which renders a limited subset of Markdown. Write Markdown, but stay inside what survives the conversion:",
  "- Supported: **bold**, *italic*, ~~strikethrough~~, `inline code`, fenced code blocks, [links](https://example.com), > blockquotes, and `-` or `1.` lists.",
  "- Headings become bold lines, so keep them to a single short line and use them sparingly. Never use a heading deeper than `###`.",
  "- Telegram has no tables, images, footnotes, or HTML. Prefer short lists over a table; if data is truly tabular, keep it to two columns rendered as `label — value` lines.",
  "- Do not nest lists more than two levels deep, and keep list items to one line each.",
  "- Chat bubbles are narrow: favour short paragraphs and avoid horizontal rules or decorative separators.",
].join("\n");

const systemPromptCache = new Map<string, Promise<string>>();

/**
 * Upper bound on memoized system prompts. Standing preferences make the prompt
 * vary per chat and per speaker, so the once-tiny combination space became
 * unbounded; this keeps the Map's insertion order approximating least-recently
 * used, the same eviction shape as CacheDriftTracker.
 */
export const MAX_CACHED_SYSTEM_PROMPTS = 200;

/**
 * Builds the system prompt, ordered so that every static segment precedes every
 * dynamic one. The inference server caches on an exact token prefix, so the
 * per-chat directives sit last and only the tail of the prompt ever differs
 * between chats. Standing preferences go after the settings directives because
 * they additionally vary per speaker, making them the most volatile part.
 *
 * The result is memoized because the string must be byte-identical across
 * turns to be worth caching at all.
 */
export const buildSystemPrompt = (
  language: Language,
  hasTools: boolean,
  responseLanguage: AssistantResponseLanguage,
  emojisEnabled: boolean,
  visionEnabled: boolean,
  preferencesDirective: string,
): Promise<string> => {
  const key =
    `${language}|${hasTools}|${responseLanguage}|${emojisEnabled}|${visionEnabled}|${
      fingerprint(preferencesDirective)
    }`;

  let cached = systemPromptCache.get(key);
  if (cached) {
    // Re-insert so the Map's insertion order approximates least-recently-used.
    systemPromptCache.delete(key);
    systemPromptCache.set(key, cached);
    return cached;
  }

  cached = (async () => {
    const soul = await loadMarkdownDoc("../../../../SOUL.md");
    const skillsDoc = await loadMarkdownDoc("../../../../SKILLS.md");

    const skillsSection = skillsDoc.length > 0
      ? `The following is the documentation of the commands and features this bot (MortyBot) supports. Use it to answer questions about what the bot can do and to point users to the right command:\n\n${skillsDoc}`
      : "";

    return [
      // Static: identical for every chat, so it is prefilled once and reused.
      "You are Morty, a Telegram group assistant.",
      soul,
      FORMATTING_INSTRUCTIONS,
      CODE_FILE_INSTRUCTIONS,
      visionEnabled ? MEDIA_INSTRUCTIONS : "",
      hasTools ? TOOL_USAGE_INSTRUCTIONS : "",
      RESPONSE_LENGTH_INSTRUCTIONS,
      skillsSection,
      // Dynamic: per-chat settings, kept last so they never shift what precedes.
      buildAssistantLanguageDirective(responseLanguage, language),
      buildAssistantEmojiDirective(emojisEnabled),
      // Most volatile: per-chat and per-speaker preferences, always last.
      preferencesDirective,
    ].filter((part) => part.length > 0).join("\n\n");
  })();

  systemPromptCache.set(key, cached);
  while (systemPromptCache.size > MAX_CACHED_SYSTEM_PROMPTS) {
    const oldest = systemPromptCache.keys().next();
    if (oldest.done) {
      break;
    }
    systemPromptCache.delete(oldest.value);
  }

  return cached;
};

const isReplyToBot = (ctx: BotContext): boolean => {
  const replied = ctx.msg?.reply_to_message;
  return replied?.from?.is_bot === true && replied.from.id === ctx.me.id;
};

/**
 * Stands in for the question when someone just drops a photo on the bot. The
 * media note above it is the whole prompt in that case.
 */
const NO_TEXT_PROMPT =
  "The user sent this without any text of their own. Respond to what they sent.";

/**
 * Describes everything this turn should be able to see: what the message
 * carries, and what it is replying to.
 *
 * The two are described separately so each note keeps its own provenance —
 * "the user is replying to a photo from @bob" answers a different question
 * from "attached photo from @bob", and three turns later that difference is
 * all the model has.
 */
const describeTurnMedia = async (
  ctx: BotContext,
  options: {
    ownMedia: MediaAttachment[];
    replyMedia: MediaAttachment[];
    onActivity: (activity: string) => void;
  },
): Promise<string[]> => {
  const { ownMedia, replyMedia, onActivity } = options;

  if (
    !ctx.configuration.assistantVisionEnabled ||
    (ownMedia.length === 0 && replyMedia.length === 0)
  ) {
    return [];
  }

  onActivity("looking at the media");

  const mediaGroupId = ctx.msg?.media_group_id;
  // An album's other items are still arriving; the wait is only ever paid by a
  // message that is both part of an album and addressed to the bot.
  const album = mediaGroupId ? await collectAlbumAttachments(mediaGroupId) : [];
  const attached = album.length > ownMedia.length ? album : ownMedia;

  const notes = await Promise.all([
    describeIncomingMedia(ctx, replyMedia),
    describeIncomingMedia(ctx, attached),
  ]);

  return notes.filter((note): note is string => Boolean(note));
};

const formatSources = (sources: Source[]): string =>
  sources.map((source) =>
    source.title ? `- [${source.title}](${source.url})` : `- ${source.url}`
  ).join("\n");

export const assistantListener: Middleware<Filter<BotContext, "message">> =
  async (ctx) => {
    const chat = ctx.chat;

    if (!chat) {
      return { handled: false };
    }

    if (!isAssistantChatAllowed(chat.id, ctx.configuration)) {
      logger().debug(
        `Assistant ignored message from chat ${chat.id}: chat is not allowlisted.`,
      );
      return { handled: false };
    }

    const chatId = chat.id;
    const ownMedia = collectMessageMedia(ctx.msg);

    // Telegram splits an album into one update per item, so every media
    // message is filed away as it arrives. By the time the one carrying the
    // question is handled, its siblings are already known.
    if (ctx.msg.media_group_id && ownMedia.length > 0) {
      getAlbumBuffer().remember(ctx.msg.media_group_id, ownMedia);
    }

    // Media arrives with its text in `caption`, and the mention that addresses
    // the bot is then an entity of the caption rather than of the message.
    const body = ctx.msg.text ?? ctx.msg.caption ?? "";
    const mentionedQuestion = extractBotMention(
      body,
      ctx.msg.entities ?? ctx.msg.caption_entities,
      ctx.me.username,
    );
    const replyToBot = isReplyToBot(ctx);

    if (
      !isAssistantMessageAddressedToBot(
        chat.type,
        mentionedQuestion,
        replyToBot,
      )
    ) {
      logger().debug(
        `Assistant ignored message from chat ${chat.id}: bot was not addressed.`,
      );
      return { handled: false };
    }

    const question = (mentionedQuestion ?? body).trim();
    const replyMedia = collectMessageMedia(ctx.msg.reply_to_message, {
      fromReply: true,
    });

    // An update with neither a question nor anything to look at — a contact, a
    // poll, a spreadsheet — is not a turn, even in a private chat where every
    // message counts as addressed to the bot.
    if (
      question.length === 0 && ownMedia.length === 0 && replyMedia.length === 0
    ) {
      logger().debug(
        `Assistant ignored message from chat ${chat.id}: nothing to answer.`,
      );
      return { handled: false };
    }

    const trajectory: AssistantTrajectoryRecorder | undefined = ctx
        .configuration.assistantTrajectoryEnabled
      ? await createAssistantTrajectoryRecorder({
        dataPath: ctx.configuration.dataPath,
        model: ctx.configuration.openAiModel,
        context: {
          chatId,
          chatType: chat.type,
          updateId: ctx.update.update_id,
          messageId: ctx.msg.message_id,
          ...(ctx.from?.id ? { userId: ctx.from.id } : {}),
          ...(ctx.from?.username ? { username: ctx.from.username } : {}),
        },
      })
      : undefined;

    const progress = await ctx.reply(ctx.t("assistant.looking")).catch(
      async (error) => {
        await trajectory?.record({
          type: "delivery_failed",
          error: serializeTrajectoryError(error),
        });
        await trajectory?.fail("progress_message", error);
        throw error;
      },
    );
    const progressMessageId = progress.message_id;

    const startAt = Date.now();
    let activity = "thinking";
    let partialAnswer = "";
    let renderedProgress = "";
    let done = false;
    let editPending = false;

    const ticker = createProgressTicker({
      intervalMs: PROGRESS_INTERVAL_MS,
      onTick: () => {
        if (done || editPending) {
          return;
        }

        // Once the answer starts arriving, show it instead of a spinner. It goes
        // out as plain text because half-written Markdown is not valid HTML, and
        // the finished reply is re-rendered properly a moment later.
        const seconds = Math.round((Date.now() - startAt) / 1000);
        const text = partialAnswer.length > 0
          ? partialAnswer.slice(0, PROGRESS_PREVIEW_LIMIT)
          : ctx.t("assistant.working", { activity, seconds });

        if (text === renderedProgress) {
          return;
        }
        renderedProgress = text;
        editPending = true;

        editProgressMessage(
          ctx.configuration.botToken,
          chatId,
          progressMessageId,
          text,
        ).finally(() => {
          editPending = false;
        });
      },
    });
    ticker.start();
    let stage = "agent";

    try {
      stage = "media";
      const mediaNotes = await describeTurnMedia(ctx, {
        ownMedia,
        replyMedia,
        onActivity: (next) => {
          activity = next;
        },
      });

      stage = "agent";
      const userContent = [
        buildReplyContext(ctx),
        ...mediaNotes,
        question.length > 0 ? question : NO_TEXT_PROMPT,
      ].filter((part): part is string => Boolean(part)).join("\n\n");

      const history = sanitizeHistory(ctx.session.assistant?.messages ?? []);
      const preferences = ctx.session.assistant?.preferences;
      const speakerPreferences = ctx.from?.id !== undefined
        ? preferences?.users.get(ctx.from.id) ?? []
        : [];
      const messages: OpenAiMessage[] = [
        {
          role: "system",
          content: await buildSystemPrompt(
            ctx.language,
            ctx.assistantApi.tools.length > 0,
            ctx.session.assistant?.responseLanguage ?? "auto",
            ctx.session.assistant?.emojisEnabled ??
              defaultAssistantEmojisEnabled,
            ctx.configuration.assistantVisionEnabled,
            buildAssistantPreferencesDirective(
              preferences?.chat ?? [],
              speakerPreferences,
            ),
          ),
        },
        ...history,
        { role: "user", content: userContent },
      ];

      const missReason = getCacheDriftTracker().record(chatId, {
        system: messageText(messages[0].content),
        tools: ctx.assistantApi.tools,
        history,
      });

      const {
        content,
        sources,
        confirmationId,
        toolInvocations,
        usage,
        mediaNotes: deliveredMediaNotes,
      } = await ctx.assistantApi.ask(
        messages,
        {
          onProgress: (next) => {
            activity = next;
          },
          onPartial: (partial) => {
            partialAnswer = partial;
          },
          onPartialDiscarded: () => {
            partialAnswer = "";
          },
          ...(trajectory
            ? { onTrajectoryEvent: (event) => trajectory.record(event) }
            : {}),
        },
      );

      done = true;
      await ticker.stop();

      reportTurnUsage({
        chatId,
        model: ctx.configuration.openAiModel,
        usage,
        missReason,
        toolCalls: toolInvocations.length,
        durationMs: Date.now() - startAt,
      });

      const emojisEnabled = ctx.session.assistant?.emojisEnabled ??
        defaultAssistantEmojisEnabled;
      const deliveredContent = emojisEnabled ? content : removeEmojis(content);
      const extracted = extractCodeFiles(deliveredContent);
      const responseText = extracted.text.length > 0
        ? extracted.text
        : extracted.files.length > 0
        ? ctx.t("assistant.filesReady", { count: extracted.files.length })
        : deliveredContent;
      const unsanitizedFinalText = sources.length > 0
        ? `${responseText}\n\n${ctx.t("assistant.sources")}\n${
          formatSources(sources)
        }`
        : responseText;
      const finalText = emojisEnabled
        ? unsanitizedFinalText
        : removeEmojis(unsanitizedFinalText);
      const deliveryText = ctx.configuration.environment === "development"
        ? `${finalText}\n\n${formatToolTrace(toolInvocations)}\n${
          formatUsageTrace(usage, missReason)
        }`
        : finalText;

      stage = "delivery";
      const chunks = chunkMessage(markdownToTelegramHtml(deliveryText));
      const pendingConfirmation = confirmationId
        ? ctx.session.assistant?.pendingToolConfirmations?.get(confirmationId)
        : undefined;
      const replyMarkup = pendingConfirmation
        ? new InlineKeyboard()
          .text(
            ctx.t("assistant.tool.confirm"),
            `${ASSISTANT_TOOL_CONFIRM_CALLBACK}${pendingConfirmation.id}`,
          )
          .text(
            ctx.t("assistant.tool.cancel"),
            `${ASSISTANT_TOOL_CANCEL_CALLBACK}${pendingConfirmation.id}`,
          )
        : undefined;
      let primaryMessageId = progressMessageId;
      const deliveredMessageIds: number[] = [];
      try {
        await ctx.api.editMessageText(chatId, progressMessageId, chunks[0], {
          parse_mode: "HTML",
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        });
      } catch (error) {
        logger().warn(
          "Assistant reply was rejected as HTML, sending it plain.",
        );
        logger().warn(error);
        const plain = telegramHtmlToPlainText(chunks[0]);
        try {
          await ctx.api.editMessageText(chatId, progressMessageId, plain, {
            ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
          });
        } catch {
          const reply = await ctx.reply(plain, {
            ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
          });
          primaryMessageId = reply.message_id;
        }
      }
      deliveredMessageIds.push(primaryMessageId);
      if (pendingConfirmation) {
        pendingConfirmation.confirmationMessageId = primaryMessageId;
      }
      for (const chunk of chunks.slice(1)) {
        try {
          const reply = await ctx.reply(chunk, { parse_mode: "HTML" });
          deliveredMessageIds.push(reply.message_id);
        } catch (error) {
          logger().warn(
            "Assistant reply was rejected as HTML, sending it plain.",
          );
          logger().warn(error);
          const reply = await ctx.reply(telegramHtmlToPlainText(chunk));
          deliveredMessageIds.push(reply.message_id);
        }
      }
      if (extracted.files.length > 0) {
        await ctx.api.sendChatAction(chatId, "upload_document");
        const encoder = new TextEncoder();
        for (const file of extracted.files) {
          const reply = await ctx.replyWithDocument(
            new InputFile(encoder.encode(file.content), file.filename),
          );
          deliveredMessageIds.push(reply.message_id);
        }
      }

      await trajectory?.record({
        type: "delivery_succeeded",
        content: deliveryText,
        messageIds: deliveredMessageIds,
        fileNames: extracted.files.map((file) => file.filename),
      });

      stage = "session_persistence";
      const updated: OpenAiMessage[] = [
        ...history,
        { role: "user", content: userContent },
        {
          role: "assistant",
          // What a bot tool posted is remembered on the assistant's own turn,
          // so the history keeps alternating user and assistant messages and
          // eviction still cuts on whole exchanges.
          content: appendMediaNotes(
            deliveredContent,
            deliveredMediaNotes ?? [],
          ),
        },
      ];
      ctx.session.assistant = {
        ...(ctx.session.assistant ?? createInitialAssistantState()),
        messages: evictHistory(updated),
        pendingToolConfirmations:
          ctx.session.assistant?.pendingToolConfirmations ?? new Map(),
      };

      await trajectory?.succeed();

      return { handled: true };
    } catch (error) {
      logger().error(error);
      done = true;
      await ticker.stop();
      if (stage === "delivery") {
        await trajectory?.record({
          type: "delivery_failed",
          error: serializeTrajectoryError(error),
        });
      }
      await trajectory?.fail(stage, error);
      try {
        await ctx.api.editMessageText(
          chatId,
          progressMessageId,
          ctx.t("assistant.error"),
        );
      } catch {
        await ctx.reply(ctx.t("assistant.error"));
      }
      return { handled: true };
    }
  };
