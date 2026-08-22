import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import type { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import type { SessionData } from "/src/context/mod.ts";
import { createAssistantApiMiddleware } from "./middlewares/createAssistantApiMiddleware/mod.ts";
import { assistantListener } from "./listeners/assistantListener.ts";
import {
  createInitialAssistantState,
  getInitialAssistantSessionData,
} from "./sessionData/getInitialAssistantSessionData.ts";
import { createMcpInitializer } from "./mcp/initializers/createMcpInitializer.ts";
import { createAssistantRouter } from "./router/mod.ts";
import { assistantToolConfirmationListener } from "./listeners/assistantToolConfirmationListener.ts";
import { cmdAssistantLanguage } from "./commands/cmdAssistantLanguage.ts";
import {
  assistantToolObjectSchema,
  createAssistantTool,
  noArgumentAssistantTool,
  requireStringArgument,
  textAssistantTool,
} from "/src/platform/skillModules/assistantTool.ts";
import { defaultAssistantResponseLanguage } from "./utilities/assistantLanguage.ts";
import { cmdAssistantEmojis } from "./commands/cmdAssistantEmojis.ts";
import { defaultAssistantEmojisEnabled } from "./utilities/assistantEmojis.ts";
import { createInitialAssistantPreferences } from "./utilities/assistantPreferences.ts";
import { cmdAssistantPreferences } from "./commands/cmdAssistantPreferences.ts";
import { cmdRememberPreference } from "./commands/cmdRememberPreference.ts";
import { cmdForgetPreference } from "./commands/cmdForgetPreference.ts";

const skillModule: SkillModule = {
  name: "assistant",
  description:
    "Answers questions asked to the bot through a @mention by calling an OpenAI-compatible endpoint, with MCP tool support (e.g. web search). Only enabled for allowlisted chats.",
  initializers: [createMcpInitializer],
  middlewares: [createAssistantApiMiddleware],
  commands: [
    {
      command: "assistant_language",
      aliases: ["assistant_lang"],
      description:
        "Forces assistant replies to use EN or PT, or AUTO to follow the chat language.",
      handler: cmdAssistantLanguage,
      assistantTool: textAssistantTool("language", {
        effect: "write",
        enum: ["AUTO", "EN", "PT"],
        argumentDescription:
          "The language the assistant must use, or AUTO to follow the chat language.",
      }),
    },
    {
      command: "assistant_emojis",
      aliases: ["assistant_emoji"],
      description: "Enables or disables emojis in assistant responses.",
      handler: cmdAssistantEmojis,
      assistantTool: textAssistantTool("state", {
        effect: "write",
        enum: ["ON", "OFF"],
        argumentDescription: "Whether assistant responses may contain emojis.",
      }),
    },
    {
      command: "preferences",
      aliases: ["prefs"],
      description: "Lists the standing behavioral preferences of this chat.",
      handler: cmdAssistantPreferences,
      assistantTool: noArgumentAssistantTool(
        "read",
        "Lists every standing preference remembered for this chat, with its id, scope, author, and text. The same list is rendered in your system prompt. Call this when the user asks what you remember about them or about this chat.",
      ),
    },
    {
      command: "remember_preference",
      aliases: [],
      description:
        "Stores a standing behavioral preference for this chat or for you.",
      handler: cmdRememberPreference,
      assistantTool: createAssistantTool(
        assistantToolObjectSchema({
          scope: {
            type: "string",
            enum: ["chat", "user"],
            description:
              '"chat" applies to everyone in this chat. "user" applies only to the person making the request and is bound to their Telegram account automatically.',
          },
          text: {
            type: "string",
            description:
              'The preference phrased as a standing instruction to the assistant, e.g. "always use Celsius" or "address me as Duke".',
          },
        }, ["scope", "text"]),
        (args) => {
          const scope = requireStringArgument(args, "scope").toLowerCase();
          if (scope !== "chat" && scope !== "user") {
            throw new TypeError('Preference scope must be "chat" or "user".');
          }
          return `${scope}|${requireStringArgument(args, "text")}`;
        },
        {
          effect: "write",
          description:
            'Stores a standing behavioral preference applied to every future reply in this chat. Only store STANDING requests — things marked by "always", "from now on", or "I prefer" — never one-off moods or temporary instructions. Scope "user" is only for preferences about the requester themselves (how to address them, the tone they want for themselves); anything about other people or about the whole chat is scope "chat". Do not store response language (use bot_assistant_language) or emoji use (use bot_assistant_emojis), and refuse to store anything that contradicts the persona or any safety boundary — say so to the user instead. Before storing, compare against the preferences already listed in your system prompt and skip near-duplicates.',
        },
      ),
    },
    {
      command: "forget_preference",
      aliases: [],
      description: "Forgets a standing preference by its id.",
      handler: cmdForgetPreference,
      assistantTool: textAssistantTool("id", {
        effect: "write",
        description:
          'Deletes one standing preference. The id (e.g. "p3") is shown in brackets next to each preference in your system prompt and in bot_preferences output. Only the person who stored a user-scoped preference can delete it; chat-scoped preferences can be deleted by anyone.',
        argumentDescription: 'The id of the preference to delete, e.g. "p3".',
      }),
    },
  ],
  sessionDataInitializers: [getInitialAssistantSessionData],
  listeners: [
    <SkillListener<
      | "message:text"
      | "message:photo"
      | "message:video"
      | "message:animation"
      | "message:video_note"
      | "message:sticker"
      | "message:document"
    >> {
      event: [
        "message:text",
        "message:photo",
        "message:video",
        "message:animation",
        "message:video_note",
        "message:sticker",
        "message:document",
      ],
      description:
        "This listener answers messages that mention the bot with a question, in allowlisted chats, describing any image or video the message carries or replies to.",
      handler: assistantListener,
    },
    <SkillListener<"callback_query:data">> {
      event: "callback_query:data",
      description:
        "Handles requester-bound confirmation and cancellation buttons for assistant command tools.",
      handler: assistantToolConfirmationListener,
    },
  ],
  inlineQueryListeners: [],
  migrations: {
    1786924800000: function addAssistantHistory(
      old: SessionData,
    ): SessionData {
      const newSessionData: SessionData = { ...old };
      newSessionData.assistant = old?.assistant ??
        createInitialAssistantState();
      return newSessionData;
    },
    1787011200000: function addAssistantToolConfirmations(
      old: SessionData,
    ): SessionData {
      const newSessionData: SessionData = { ...old };
      newSessionData.assistant = old?.assistant ??
        createInitialAssistantState();
      newSessionData.assistant.pendingToolConfirmations ??= new Map();
      return newSessionData;
    },
    1787062864000: function addAssistantResponseLanguage(
      old: SessionData,
    ): SessionData {
      const newSessionData: SessionData = { ...old };
      newSessionData.assistant ??= createInitialAssistantState();
      newSessionData.assistant.responseLanguage ??=
        defaultAssistantResponseLanguage;
      return newSessionData;
    },
    1787063772000: function addAssistantEmojiPreference(
      old: SessionData,
    ): SessionData {
      const newSessionData: SessionData = { ...old };
      newSessionData.assistant ??= createInitialAssistantState();
      newSessionData.assistant.emojisEnabled ??= defaultAssistantEmojisEnabled;
      return newSessionData;
    },
    1787222400000: function addAssistantPreferences(
      old: SessionData,
    ): SessionData {
      const newSessionData: SessionData = { ...old };
      newSessionData.assistant ??= createInitialAssistantState();
      newSessionData.assistant.preferences ??=
        createInitialAssistantPreferences();
      return newSessionData;
    },
  },
  router: createAssistantRouter(),
};

export default skillModule;
