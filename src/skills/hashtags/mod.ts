import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { hashtagMentionListener } from "./listeners/hashtagMention.ts";
import { cmdJoin } from "./commands/cmdJoin.ts";
import { cmdLeave } from "./commands/cmdLeave.ts";
import { getInitialHashtagChannelSessionData } from "./sessionData/getInitialTagChannelSessionData.ts";

export const name: SkillModule["name"] = "hashtags";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
  {
    command: "join_hashtag",
    aliases: [],
    description: "Join hashtag channel and get notified",
    handler: cmdJoin,
  },
  {
    command: "leave_hashtag",
    aliases: [],
    description: "Leave hashtag channel",
    handler: cmdLeave,
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
