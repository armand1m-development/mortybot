import type { Chat, Message } from "grammy/types";
import type { BotContext } from "/src/context/mod.ts";
import type {
  OpenAiTool,
  ToolCallResult,
} from "/src/skills/assistant/httpClients/types.ts";
import { normalizeOpenAiTools } from "/src/skills/assistant/utilities/normalizeTools.ts";
import { executeSkillCommand } from "./executeSkillCommand.ts";
import { createSentMediaCollector } from "./sentMediaCollector.ts";
import {
  createSentTextCollector,
  createSentTextObserver,
} from "./sentTextCollector.ts";
import type { SkillModule } from "./types/SkillModule.ts";
import type {
  SkillCommand,
  SkillCommandToolEffect,
} from "./types/SkillCommand.ts";

const TOOL_PREFIX = "bot_";

/**
 * Appended to the description of volatile commands. The model meets tool
 * descriptions on every turn, so this is the most local place to counter its
 * habit of answering "how is it now?" from an earlier fetch's media note.
 */
const VOLATILE_TOOL_DIRECTIVE =
  "Live snapshot: only current at the moment it runs. Call this tool on every request about present conditions, even when an earlier result is quoted in the conversation history; never answer such a request from memory or from an earlier fetch.";

/** Tool argument the model uses to choose between posting and inspecting. */
const DELIVER_TO_CHAT_ARGUMENT = "deliver_to_chat";

const DELIVER_TO_CHAT_PARAMETER = {
  type: "boolean",
  description:
    "Set false to receive this command's output as data to analyze and answer from, instead of posting it to the chat. Omit it (or set true) when the user wants the full listing posted as-is.",
};

/**
 * Merges the delivery switch into a command's schema without mutating the
 * schema the skill declared.
 */
const withDeliverToChatParameter = (
  parameters: Record<string, unknown>,
): Record<string, unknown> => ({
  ...parameters,
  properties: {
    ...(parameters.properties as Record<string, unknown> | undefined),
    [DELIVER_TO_CHAT_ARGUMENT]: DELIVER_TO_CHAT_PARAMETER,
  },
});

const parseDeliverToChat = (value: unknown): boolean => {
  if (value === undefined) {
    return true;
  }
  if (typeof value !== "boolean") {
    throw new TypeError(`"${DELIVER_TO_CHAT_ARGUMENT}" must be a boolean.`);
  }
  return value;
};

/** Hard ceiling on captured output, so a huge listing cannot flood the turn. */
const MAX_INSPECTED_OUTPUT_CHARACTERS = 12_000;

/**
 * A delivered command's short replies — one-line results and error messages —
 * travel back to the model, because they are the only honest account of what
 * the user is looking at when no media was posted. Anything longer is a
 * listing the chat already received, and serializing it again would only
 * invite the model to repeat it.
 */
const MAX_DELIVERED_TEXT_CHARACTERS = 600;

const formatInspectedCommandOutput = (
  command: string,
  texts: string[],
): string => {
  if (texts.length === 0) {
    return `/${command} produced no output, and nothing was posted to the chat.`;
  }

  const joined = texts.join("\n\n");
  const output = joined.length > MAX_INSPECTED_OUTPUT_CHARACTERS
    ? `${joined.slice(0, MAX_INSPECTED_OUTPUT_CHARACTERS)}\n…[truncated]`
    : joined;

  return `/${command} ran with its delivery suppressed. Nothing was posted to the chat. Its full output follows as data — answer the user's question from it, and do not claim anything was sent. If the user wants the listing itself posted, call the tool again with ${DELIVER_TO_CHAT_ARGUMENT}=true.\n\n${output}`;
};

interface RegisteredCommandTool {
  skillName: string;
  command: SkillCommand;
}

export interface PreparedSkillCommandToolCall {
  name: string;
  skillName: string;
  command: string;
  input: string;
  effect: SkillCommandToolEffect;
  description: string;
  /** Whether this call posts its output to the chat or returns it as data. */
  deliverToChat: boolean;
}

export interface SkillCommandToolsContext {
  skillCommandTools: SkillCommandToolRegistry;
}

export interface SkillCommandExecutionOptions {
  /** Message the command should behave as if it were replying to. */
  sourceMessage?: Message;
  /**
   * Inspects the media the command posted into the chat and returns a note
   * describing it, or undefined when there is nothing worth remembering. The
   * command's description comes along so the describing pass knows what kind
   * of media it is looking at.
   *
   * Injected rather than imported so the platform stays unaware of how the
   * assistant looks at images.
   */
  onMediaSent?: (
    messages: Message[],
    command: string,
    description?: string,
  ) => Promise<string | undefined>;
}

export class SkillCommandToolRegistry {
  private readonly tools = new Map<string, RegisteredCommandTool>();
  /**
   * Memoized tool arrays per chat type. The same instance is returned until the
   * skills are re-registered, so callers can memoize with a reference check.
   */
  private readonly openAiTools = new Map<string, OpenAiTool[]>();

  registerSkills(skills: SkillModule[]): void {
    this.tools.clear();
    this.openAiTools.clear();
    for (const skill of skills) {
      for (const command of skill.commands) {
        const name = `${TOOL_PREFIX}${command.command}`;
        if (this.tools.has(name)) {
          throw new Error(`Duplicate assistant command tool name "${name}".`);
        }
        this.tools.set(name, { skillName: skill.name, command });
      }
    }
  }

  getOpenAiTools(chatType?: Chat["type"]): OpenAiTool[] {
    const key = chatType ?? "*";
    const cached = this.openAiTools.get(key);
    if (cached) {
      return cached;
    }

    const tools = normalizeOpenAiTools(
      [...this.tools.entries()]
        .filter(([, { command }]) =>
          !chatType || !command.chatType ||
          command.chatType.includes(chatType)
        )
        .map(([name, { skillName, command }]) => ({
          type: "function" as const,
          function: {
            name,
            description: [
              command.assistantTool.description ??
                `${command.description} (MortyBot skill: ${skillName}, command: /${command.command})`,
              ...(command.assistantTool.volatile
                ? [VOLATILE_TOOL_DIRECTIVE]
                : []),
            ].join(" "),
            parameters: command.assistantTool.inspectable
              ? withDeliverToChatParameter(command.assistantTool.parameters)
              : command.assistantTool.parameters,
          },
        })),
    );

    this.openAiTools.set(key, tools);

    return tools;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Whether a slash command with this name — canonical or alias — is
   * registered and available in the given chat type, i.e. whether the command
   * chain would claim a message leading with it. Unlike `has()`, this looks up
   * command names, not `bot_`-prefixed tool names.
   */
  isRegisteredCommand(commandName: string, chatType?: Chat["type"]): boolean {
    return [...this.tools.values()].some(({ command }) =>
      (command.command === commandName ||
        command.aliases.includes(commandName)) &&
      (!chatType || !command.chatType ||
        command.chatType.includes(chatType))
    );
  }

  prepare(
    name: string,
    args: Record<string, unknown>,
    chatType?: Chat["type"],
  ): PreparedSkillCommandToolCall {
    const registered = this.tools.get(name);
    if (!registered) throw new Error(`Unknown bot command tool "${name}".`);

    const { skillName, command } = registered;
    if (
      chatType && command.chatType &&
      !command.chatType.includes(chatType)
    ) {
      throw new Error(
        `Command /${command.command} is not available in ${chatType} chats.`,
      );
    }

    return {
      name,
      skillName,
      command: command.command,
      input: command.assistantTool.toCommandInput(args),
      effect: command.assistantTool.effect,
      description: command.description,
      deliverToChat: command.assistantTool.inspectable
        ? parseDeliverToChat(args[DELIVER_TO_CHAT_ARGUMENT])
        : true,
    };
  }

  async execute(
    ctx: BotContext,
    prepared: PreparedSkillCommandToolCall,
    options: SkillCommandExecutionOptions = {},
  ): Promise<ToolCallResult> {
    const registered = this.tools.get(prepared.name);
    if (!registered || registered.command.command !== prepared.command) {
      return { text: "This bot command is no longer available.", sources: [] };
    }

    if (!prepared.deliverToChat) {
      const text = createSentTextCollector();

      await executeSkillCommand(
        registered.skillName,
        registered.command,
        ctx,
        prepared.input,
        {
          ...(options.sourceMessage
            ? { sourceMessage: options.sourceMessage }
            : {}),
          api: text.wrap(ctx.api),
        },
      );

      return {
        text: formatInspectedCommandOutput(prepared.command, text.texts),
        sources: [],
      };
    }

    const text = createSentTextObserver();
    const media = options.onMediaSent ? createSentMediaCollector() : undefined;

    await executeSkillCommand(
      registered.skillName,
      registered.command,
      ctx,
      prepared.input,
      {
        ...(options.sourceMessage
          ? { sourceMessage: options.sourceMessage }
          : {}),
        api: media ? media.wrap(text.wrap(ctx.api)) : text.wrap(ctx.api),
      },
    );

    const mediaNote = media && media.messages.length > 0
      ? await options.onMediaSent?.(
        media.messages,
        prepared.command,
        prepared.description,
      )
      : undefined;

    // The result must describe what actually happened, because the model's
    // reply is built on it alone: a command whose fetch failed replies with an
    // error string, and telling the model "delivery succeeded" turns that
    // failure into a confident lie.
    const deliveredText = text.texts.join("\n\n");
    const textBranch = deliveredText.length > 0 &&
      deliveredText.length <= MAX_DELIVERED_TEXT_CHARACTERS;

    const resultText = [
      mediaNote
        ? [
          `/${prepared.command} handled the request and delivered its media to the Telegram chat.`,
          "What it posted is described below. Confirm the delivery in one short line, then briefly analyze the pictures for the user — for camera feeds that means traffic, movement and congestion. Never repeat the description verbatim, and never state anything it does not support.",
          `What it posted: ${mediaNote}`,
        ]
        : media && media.messages.length > 0
        ? [
          `/${prepared.command} posted ${media.messages.length} media messages to the Telegram chat, but they could not be analyzed, so nothing is known about what they show. Confirm the delivery in one line and say plainly that you cannot analyze the pictures. Never describe, guess, or invent their content.`,
        ]
        : textBranch
        ? [
          `/${prepared.command} replied directly in the Telegram chat with the message below. It is the command's own report of what happened: if it announces a failure, relay that honestly instead of claiming success.`,
          deliveredText,
        ]
        : [
          `/${prepared.command} handled the request and delivered its output or guidance directly in the Telegram chat. Reply with only a brief confirmation.`,
        ],
    ].flat().join("\n");

    return {
      text: resultText,
      sources: [],
      deliveredToChat: true,
      ...(mediaNote ? { mediaNotes: [mediaNote] } : {}),
    };
  }
}
