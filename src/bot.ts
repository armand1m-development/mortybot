import { resolve } from "std/path/posix.ts";
import { Bot, Context, session } from "grammy/mod.ts";
import { sequentialize } from "grammy_runner/mod.ts";
import { FileAdapter } from "grammy_storages/file/src/mod.ts";
import { BotContext, SessionData } from "/src/context/mod.ts";
import { Configuration } from "./platform/configuration/middlewares/types.ts";
import { createConfigurationMiddleware } from "./platform/configuration/middlewares/createConfigurationMiddleware.ts";
import { injectGlobalErrorHandler } from "./platform/errorHandling/globalErrorHandler.ts";
import { SkillModule } from "./types/SkillModule.ts";

const skills = [
  "currency",
  "filters",
  "weather",
] as const;

type Skill = typeof skills[number];

const loadSkill = async (skillName: Skill) => {
  const skillModule = await import(
    `./skills/${skillName}/mod.ts`
  ) as SkillModule;

  if (!skillModule) {
    throw new Error(
      `Failed to load skill module named "${skillName}". Make sure it matches the schema needed.`,
    );
  }

  return skillModule;
};

export const createBot = async (configuration: Configuration) => {
  const bot = new Bot<BotContext>(configuration.botToken);

  const loadedSkills = await Promise.all(skills.map(loadSkill));

  const getSessionKey = (ctx: Context) => {
    return ctx.chat?.id.toString();
  };

  let initialSessionData: Partial<SessionData> = {};

  loadedSkills.forEach((skill) => {
    console.log(`Running session initializer for skill "${skill.name}"`);
    skill.sessionDataInitializers.forEach((initializer) => {
      initialSessionData = {
        ...initialSessionData,
        ...initializer(),
      };
    });
  });

  bot.use(createConfigurationMiddleware(configuration));
  bot.use(sequentialize(getSessionKey));
  bot.use(session({
    getSessionKey,
    initial: () => initialSessionData as SessionData,
    storage: new FileAdapter({
      dirName: resolve(configuration.dataPath, "./sessions"),
    }),
  }));

  loadedSkills.forEach((skill) => {
    console.log(`Loading skill "${skill.name}"`);

    skill.middlewares.forEach((createMiddleware) => {
      console.log(`Loading middlewares for skill "${skill.name}"`);
      bot.use(createMiddleware());
    });

    skill.commands.forEach((command) => {
      console.log(
        `Loading command "/${command.command}" with aliases "${
          command.aliases.join(", ")
        }" for skill "${skill.name}"`,
      );
      bot.command([command.command, ...command.aliases], command.handler);
    });
  });

  injectGlobalErrorHandler(bot);

  return bot;
};
