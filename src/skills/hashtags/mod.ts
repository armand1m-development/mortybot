import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { hashtagMentionListener } from "./listeners/hashtagMention.ts";
import { cmdJoin } from "./commands/cmdJoin.ts";
import { cmdLeave } from "./commands/cmdLeave.ts";
import { cmdListHashtags } from "./commands/cmdList.ts";
import { getInitialHashtagChannelSessionData } from "./sessionData/getInitialTagChannelSessionData.ts";
import { SessionData } from "../../context/mod.ts";

export const name: SkillModule["name"] = "hashtags";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
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
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] = [
  getInitialHashtagChannelSessionData,
];

export const listeners: SkillModule["listeners"] = [
  <SkillListener<"message:text">> {
    event: "message:text",
    description:
      "Listens to a hashtag and mentions the people registered on it.",
    handler: hashtagMentionListener,
  },
];

export const inlineQueryListeners: SkillModule["listeners"] = [];

export const migrations: SkillModule["migrations"] = {
  1: function addHashtagChannelsToSession(old: SessionData): SessionData {
    return {
      ...old,
      hashtagChannels: old.hashtagChannels ?? new Map(),
    };
  },
};
