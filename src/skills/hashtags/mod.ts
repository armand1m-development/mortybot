import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import type { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { hashtagMentionListener } from "./listeners/hashtagMention.ts";
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
    },
    {
      command: "leave_hashtag",
      aliases: [],
      description: "Leave a hashtag channel. Example: /leave_hashtag #games",
      handler: cmdLeave,
    },
    {
      command: "list_hashtags",
      aliases: ["hashtags"],
      description:
        "List all hashtags in the group. Usage: /list_hashtags or /hashtags",
      handler: cmdListHashtags,
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
