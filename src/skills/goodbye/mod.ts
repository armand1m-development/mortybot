import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { getInitialGoodbyeCounterSessionData } from "./sessionData/getInitialGoodbyeCounterSessionData.ts";
import { goodbyeListener } from "./listeners/goodbyeListener.ts";
import { cmdLeavingRank } from "./commands/cmdLeavingRank.ts";

const skillModule: SkillModule = {
  name: "goodbye",
  initializers: [],
  middlewares: [],
  commands: [
    {
      command: "leaving_rank",
      aliases: ["quemsaiudogrupo"],
      description:
        "Ranks the group members by the amount of times they left the group.",
      handler: cmdLeavingRank,
      chatType: ["group", "supergroup"],
    },
  ],
  sessionDataInitializers: [getInitialGoodbyeCounterSessionData],
  listeners: [
    <SkillListener<":left_chat_member">> {
      event: ":left_chat_member",
      description:
        "This listener checks when someone leaves the group and adds to a counter",
      handler: goodbyeListener,
    },
  ],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
