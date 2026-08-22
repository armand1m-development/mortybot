import type { Chat, Message } from "grammy/types";
import type { BotContext } from "/src/context/mod.ts";
import type {
  OpenAiTool,
  ToolCallResult,
} from "/src/skills/assistant/httpClients/types.ts";
import { normalizeOpenAiTools } from "/src/skills/assistant/utilities/normalizeTools.ts";
import { executeSkillCommand } from "./executeSkillCommand.ts";
import { createSentMediaCollector } from "./sentMediaCollector.ts";
import type { SkillModule } from "./types/SkillModule.ts";
import type {
  SkillCommand,
  SkillCommandToolEffect,
} from "./types/SkillCommand.ts";

const TOOL_PREFIX = "bot_";

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
}

export interface SkillCommandToolsContext {
  skillCommandTools: SkillCommandToolRegistry;
}

export interface SkillCommandExecutionOptions {
  /** Message the command should behave as if it were replying to. */
  sourceMessage?: Message;
  /**
   * Inspects the media the command posted into the chat and returns a note
   * describing it, or undefined when there is nothing worth remembering.
   *
   * Injected rather than imported so the platform stays unaware of how the
   * assistant looks at images.
   */
  onMediaSent?: (
    messages: Message[],
    command: string,
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
            description: command.assistantTool.description ??
              `${command.description} (MortyBot skill: ${skillName}, command: /${command.command})`,
            parameters: command.assistantTool.parameters,
          },
        })),
    );

    this.openAiTools.set(key, tools);

    return tools;
  }

  has(name: string): boolean {
    return this.tools.has(name);
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
        ...(media ? { api: media.wrap(ctx.api) } : {}),
      },
    );

    const mediaNote = media && media.messages.length > 0
      ? await options.onMediaSent?.(media.messages, prepared.command)
      : undefined;

    return {
      text: [
        `/${prepared.command} handled the request and delivered its output or guidance directly in the Telegram chat. Reply with only a brief confirmation.`,
        // The model cannot see what the command posted, so the description of
        // it is the only way an answer can refer to the pictures the user is
        // looking at right now.
        ...(mediaNote ? [`What it posted: ${mediaNote}`] : []),
      ].join("\n"),
      sources: [],
      deliveredToChat: true,
      ...(mediaNote ? { mediaNotes: [mediaNote] } : {}),
    };
  }
}
