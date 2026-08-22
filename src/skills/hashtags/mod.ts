import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import type { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { hashtagMentionListener } from "./listeners/hashtagMention.ts";
import {
  assistantToolObjectSchema,
  createAssistantTool,
  noArgumentAssistantTool,
} from "/src/platform/skillModules/assistantTool.ts";

const hashtagTool = (description: string) =>
  createAssistantTool(
    assistantToolObjectSchema({
      hashtags: {
        type: "array",
        description,
        minItems: 1,
        items: { type: "string" },
      },
    }, ["hashtags"]),
    (args) => {
      const hashtags = args.hashtags;
      if (
        !Array.isArray(hashtags) || hashtags.length === 0 ||
        !hashtags.every((value) =>
          typeof value === "string" && value.trim().length > 0
        )
      ) {
        throw new TypeError(
          'Tool argument "hashtags" must be a non-empty string array.',
        );
      }
      return hashtags.map((value) => {
        const hashtag = (value as string).trim();
        return hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
      }).join(" ");
    },
    { effect: "write" },
  );
import { cmdJoin } from "./commands/cmdJoin.ts";
import { cmdLeave } from "./commands/cmdLeave.ts";
import { cmdListHashtags } from "./commands/cmdList.ts";
import { getInitialHashtagChannelSessionData } from "./sessionData/getInitialTagChannelSessionData.ts";
import type { SessionData } from "../../context/mod.ts";

const skillModule: SkillModule = {
  name: "hashtags",
  description: "Commands to list, join and leave hashtag channels.",
  initializers: [],
  middlewares: [],
  commands: [
    {
      command: "join_hashtag",
      aliases: [],
      description:
        "Join hashtag channel and get notified. Example: /join_hashtag #games",
      handler: cmdJoin,
      assistantTool: hashtagTool("The hashtag channels to join."),
    },
    {
      command: "leave_hashtag",
      aliases: [],
      description: "Leave a hashtag channel. Example: /leave_hashtag #games",
      handler: cmdLeave,
      assistantTool: hashtagTool("The hashtag channels to leave."),
    },
    {
      command: "list_hashtags",
      aliases: ["hashtags"],
      description:
        "List all hashtags in the group. Usage: /list_hashtags or /hashtags",
      handler: cmdListHashtags,
      assistantTool: noArgumentAssistantTool(),
    },
  ],
  sessionDataInitializers: [getInitialHashtagChannelSessionData],
  listeners: [
    <SkillListener<"message:text">> {
      event: "message:text",
      description:
        "Listens to a hashtag and mentions the people registered on it.",
      handler: hashtagMentionListener,
    },
  ],
  inlineQueryListeners: [],
  migrations: {
    1717523297859: function addHashtagChannelsToSession(
      old: SessionData,
    ): SessionData {
      return {
        ...old,
        hashtagChannels: old.hashtagChannels ?? new Map(),
      };
    },
  },
  router: null,
};

export default skillModule;
