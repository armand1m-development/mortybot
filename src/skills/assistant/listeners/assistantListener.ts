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
  containsHistoryToolTraceMarker,
  prependHistoryToolTrace,
  stripHistoryToolTraceMarkers,
} from "../utilities/historyToolTrace.ts";
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
  extractLeadingCommandName,
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
import type { AssistantAskOptions } from "../middlewares/createAssistantApiMiddleware/types.ts";
import { collectMessageMedia } from "../vision/collectMessageMedia.ts";
import { collectAlbumAttachments } from "../vision/albumBuffer.ts";
import { describeIncomingMedia } from "../vision/describeChatMedia.ts";
import {
  appendMediaNotes,
  findDeliveredMediaNoteCommands,
  scrubStaleDeliveredMediaNotes,
  stripDeliveredMediaNotes,
} from "../vision/mediaMemory.ts";
import { mergeTurnMedia } from "../vision/mergeTurnMedia.ts";
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
  "- Read-only tools cost nothing and change nothing. When the user asks about current conditions or about this chat's state — however casually phrased — call the matching tool right away instead of asking whether to proceed: asking permission for a read-only fetch only wastes a turn. Confirmation questions belong to state-changing actions.",
  "- Bot tools deliver their native Telegram output directly, including photos and media groups. After a successful bot tool, reply with a brief contextual confirmation; when it posted photos, add a short analysis of what they show.",
  "- Some read-only bot tools accept a `deliver_to_chat` argument. Call them with `deliver_to_chat: false` to receive their output as data and answer from it — for example when the user asks which entries relate to a topic, or any question about part of a listing. Omit the argument (or set it to true) only when the user wants the full listing posted as-is.",
  "- When a dedicated search tool exists for a large collection — `bot_search_filters` for this chat's filters, say — call it with the user's terms instead of reading the whole collection; it returns only the relevant entries, ranked.",
  "- Never claim a bot command ran, or that its output was delivered, unless you called its tool in this same turn. If you made no tool call, nothing was posted.",
  "- State-changing bot tools do not run immediately. If a tool reports that approval is required, briefly explain the pending action and tell the user to use the Confirm or Cancel button.",
  "- ALWAYS call a search tool when the user asks you to 'search the web', 'look this up', 'find out', or anything implying they want you to retrieve external information.",
  "- ALWAYS call a search tool for questions about current events, recent news, live scores, prices, weather, schedules, or anything that changes over time.",
  "- Road cameras and any other tool calling itself a live snapshot are stale the moment they are posted. When the user asks about present conditions — however phrased, and however recently a previous fetch's note appears in the conversation history — call the tool again in this same turn.",
  "- What exists in a particular chat — its filters, meme templates, hashtags, preferences — is state no model can know ahead of time. Never list, count or name such items unless a tool result from this turn backs every one; when no tool can answer, say so plainly instead of inventing.",
  "- If you are uncertain whether your training data covers the topic, search instead of guessing.",
  "- Call `get_time` whenever an answer depends on what 'now' is — the current time or date, how old something is, whether an event has passed. The bot lives in Amsterdam, and the tool reports that local time plus UTC. Never guess the time.",
  "- Do NOT search for: general knowledge you already know well (e.g. 'what is gravity'), opinions, or questions about this bot's own commands (use the skills doc below).",
  "",
  "### After using tools",
  "- Incorporate the results into your answer naturally.",
  "- Cite sources at the end of your reply when you relied on search results.",
  "- If the search returned no useful results, say so honestly rather than making something up.",

  "### Tool results in conversation history",
  "- Tool calls and their results are not replayed in the conversation history. An earlier assistant reply may begin with a `[tools called this turn: ...]` marker naming the tools that produced it; no marker means no tool ran in that turn. The marker is written by the bot alone after a reply is delivered — never write, predict, or imitate it in a reply of your own.",
  "- Media or output that a bot tool delivered in an earlier turn exists only in that turn. Telegram does not re-send it, and neither do you: every new request must invoke the tool again in the same turn.",
  "- If the user says something was not delivered, believe them immediately and re-run the tool. Never blame their client, and never insist on a delivery you cannot back with a tool call from this turn.",
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
  "- When a bot tool has already delivered its output to the chat, never reproduce it — acknowledge it briefly, plus a short analysis of any photos it posted.",
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
  "- A bracketed note about media a bot command posted, with the time it was fetched, describes what the chat saw at that moment. In the turn that called the tool, answer from it instead of only confirming that the command ran; in any later turn it is a stale record, not live data — re-run the tool before saying anything about present conditions.",
  "- Bracketed notes are written only by the bot's vision pass after media is really posted. Never write, extend, or imitate one yourself: if no tool call posted media in this turn, there is nothing to describe.",
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
 * Describes everything this turn should be able to see — what the message
 * carries and what it is replying to — in a single vision pass, so
 * `assistantVisionMaxImages` really is a per-turn ceiling across every
 * attachment instead of a per-call one. Reply media leads the merged list:
 * when the budget truncates it, the user's own and less relevant media drops
 * off rather than what they explicitly pointed at.
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

  const note = await describeIncomingMedia(
    ctx,
    mergeTurnMedia(replyMedia, attached),
  );

  return note ? [note] : [];
};

const formatSources = (sources: Source[]): string =>
  sources.map((source) =>
    source.title ? `- [${source.title}](${source.url})` : `- ${source.url}`
  ).join("\n");

/**
 * The correction handed back to a model that answered with a forged
 * delivered-media note, so the retry knows exactly what went wrong and what
 * the honest alternatives are.
 */
const buildFabricationCorrection = (
  commands: string[],
  forgedMarker: boolean,
): string =>
  [
    "Correction: your previous reply contained fabricated evidence of tool calls you never made in that turn.",
    ...(commands.length > 0
      ? [
        `It invented bracketed media notes (${
          commands
            .map((command) => `[… that /${command} posted here…]`)
            .join(" ")
        }) for tools that never ran.`,
      ]
      : []),
    ...(forgedMarker
      ? [
        'It contained a forged "[tools called this turn: …]" marker. That marker is written only by the bot after a reply is delivered; a reply of yours can never legitimately contain it.',
      ]
      : []),
    "Nothing was posted to the chat, and the user saw no images.",
    "Answer again. If the user wants current camera images or any other live data, call the matching bot tool for it now; otherwise say plainly that nothing was retrieved. Never write a bracketed media note or a tool-trace marker yourself.",
    "Earlier conversation has been set aside for this retry: answer the user's message on its own.",
    "The user never saw the rejected reply. Do not mention it, apologize for it, or call it corrupted or failed — deliver this reply as if it were the first and only one.",
  ].join(" ");

/**
 * Messages for the corrective retry after a reply forged delivery evidence.
 *
 * The history is deliberately left out. By this point it is the poison: the
 * model fabricated once while reading it, and a retry that re-reads the same
 * precedent fabricates again — observed as an apology immediately followed
 * by a second forged marker. A context-free retry answers the user's message
 * alone, which is the condition under which the model reliably makes the
 * real tool call.
 */
export const buildFabricationRetryMessages = (
  systemMessage: OpenAiMessage,
  userMessage: OpenAiMessage,
  fabricatedContent: string,
  commands: string[],
  forgedMarker: boolean,
): OpenAiMessage[] => [
  systemMessage,
  userMessage,
  { role: "assistant", content: fabricatedContent },
  {
    role: "user",
    content: buildFabricationCorrection(commands, forgedMarker),
  },
];

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

    // Media arrives with its text in `caption`, and the mention that addresses
    // the bot is then an entity of the caption rather than of the message.
    const body = ctx.msg.text ?? ctx.msg.caption ?? "";
    const mention = extractBotMention(
      body,
      ctx.msg.entities ?? ctx.msg.caption_entities,
      ctx.me.username,
    );
    const replyToBot = isReplyToBot(ctx);

    if (
      !isAssistantMessageAddressedToBot(
        chat.type,
        mention !== undefined,
        replyToBot,
      )
    ) {
      logger().debug(
        `Assistant ignored message from chat ${chat.id}: bot was not addressed.`,
      );
      return { handled: false };
    }

    // A message leading with a slash command is owned by the command chain,
    // which runs concurrently with this forked listener; treating it as an
    // assistant turn as well would re-run the same handler through a bot_
    // tool. Step aside only when the command chain really claims the message:
    // a known command, available in this chat type, addressed to this bot —
    // commands in media captions never qualify.
    const leadingCommand = extractLeadingCommandName(
      ctx.msg.text,
      ctx.msg.entities,
      ctx.me.username,
    );
    if (
      leadingCommand !== undefined &&
      ctx.skillCommandTools.isRegisteredCommand(leadingCommand, chat.type)
    ) {
      logger().debug(
        `Assistant ignored message from chat ${chat.id}: command "/${leadingCommand}" is handled by the command chain.`,
      );
      return { handled: false };
    }

    const question = (mention?.question ?? body).trim();
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

      // Stale delivered-media notes are scrubbed before every request: an
      // old camera note is worthless as data and dangerous as precedent,
      // because the model imitates the delivery claim instead of re-running
      // the tool. The current turn's fresh note joins the history after this.
      const history = scrubStaleDeliveredMediaNotes(
        sanitizeHistory(ctx.session.assistant?.messages ?? []),
      );
      const preferences = ctx.session.assistant?.preferences;
      const speakerPreferences = ctx.from?.id !== undefined
        ? preferences?.users.get(ctx.from.id) ?? []
        : [];
      const systemMessage: OpenAiMessage = {
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
      };
      const userMessage: OpenAiMessage = { role: "user", content: userContent };
      const messages: OpenAiMessage[] = [
        systemMessage,
        ...history,
        userMessage,
      ];

      const missReason = getCacheDriftTracker().record(chatId, {
        system: messageText(messages[0].content),
        tools: ctx.assistantApi.tools,
        history,
      });

      const askOptions: AssistantAskOptions = {
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
      };
      let turn = await ctx.assistantApi.ask(messages, askOptions);

      // Two pieces of delivery evidence are machine-written only, never part
      // of a model reply: bracketed media notes (backed by a same-turn tool
      // call) and the tool-trace marker (prepended after delivery). A reply
      // carrying either without the backing tool call is forging it —
      // typically to skip re-fetching a camera — and is never delivered
      // as-is: one corrective retry, then the forgery is stripped and the
      // user is told the truth.
      const fabricatedCommandsIn = (
        result: typeof turn,
      ): string[] =>
        [
          ...new Set(findDeliveredMediaNoteCommands(result.content)),
        ].filter((command) =>
          !result.toolInvocations.some(({ name }) => name === `bot_${command}`)
        );

      const stripFabrications = (content: string): string =>
        stripHistoryToolTraceMarkers(stripDeliveredMediaNotes(content));

      let unbackedNotes = fabricatedCommandsIn(turn);
      let forgedMarker = containsHistoryToolTraceMarker(turn.content);
      if (unbackedNotes.length > 0 || forgedMarker) {
        logger().warn(
          `Assistant reply forged delivery evidence${
            unbackedNotes.length > 0
              ? ` (media notes for: ${
                unbackedNotes.map((command) => `/${command}`).join(", ")
              })`
              : ""
          }${forgedMarker ? " (tool-trace marker)" : ""}. Retrying once.`,
        );
        try {
          const retried = await ctx.assistantApi.ask(
            buildFabricationRetryMessages(
              systemMessage,
              userMessage,
              turn.content,
              unbackedNotes,
              forgedMarker,
            ),
            askOptions,
          );
          unbackedNotes = fabricatedCommandsIn(retried);
          forgedMarker = containsHistoryToolTraceMarker(retried.content);
          turn = unbackedNotes.length > 0 || forgedMarker
            ? { ...retried, content: stripFabrications(retried.content) }
            : retried;
        } catch (error) {
          logger().error("Corrective retry after forged evidence failed.");
          logger().error(error);
          turn = { ...turn, content: stripFabrications(turn.content) };
        }
      }

      const {
        content,
        sources,
        confirmationId,
        toolInvocations,
        usage,
        mediaNotes: deliveredMediaNotes,
      } = turn;
      const answerContent = unbackedNotes.length > 0 || forgedMarker
        ? `${content}\n\n${ctx.t("assistant.mediaNotDelivered")}`
        : content;

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
      const deliveredContent = emojisEnabled
        ? answerContent
        : removeEmojis(answerContent);
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
          // eviction still cuts on whole exchanges. The tool trace keeps the
          // cause of side-effecting deliveries visible to later turns, so the
          // model imitates the tool call instead of the delivery claim.
          content: appendMediaNotes(
            prependHistoryToolTrace(toolInvocations, deliveredContent),
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
