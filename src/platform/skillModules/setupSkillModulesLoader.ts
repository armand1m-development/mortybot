import { resolve } from "std/path/posix.ts";
import { getLogger } from "std/log/mod.ts";
import { Bot } from "grammy/mod.ts";
import { BotCommand } from "grammy/types.ts";
import { BotContext, SessionData } from "/src/context/mod.ts";
import type { Skill } from "./skills.ts";
import { SkillModule } from "./types/SkillModule.ts";

const logger = () => getLogger();

const loadSkill = async (skillName: Skill) => {
  const skillModule = await import(
    resolve(Deno.cwd(), `./src/skills/${skillName}/mod.ts`)
  ) as SkillModule;

  if (!skillModule) {
    throw new Error(
      `Failed to load skill module named "${skillName}". Make sure it matches the schema needed.`,
    );
  }

  return skillModule;
};

export const setupSkillModulesLoader = async (
  skills: readonly Skill[],
  bot: Bot<BotContext>,
) => {
  const loadedSkills = await Promise.all(skills.map(loadSkill));

  const createSessionData = () => {
    let initialSessionData: Partial<SessionData> = {};

    loadedSkills.forEach((skill) => {
      logger().debug(`Running "${skill.name}" session initializers..`);
      skill.sessionDataInitializers.forEach((initializer) => {
        initialSessionData = {
          ...initialSessionData,
          ...initializer(),
        };
      });
    });

    return initialSessionData as SessionData;
  };

  const loadSkillMiddlewares = (skill: SkillModule) => {
    logger().debug(`Loading skill "${skill.name}" middlewares..`);
    skill.middlewares.forEach((createMiddleware) => {
      // TODO: consider properties to be injected
      // in every middleware loader, to enhance flexibility
      bot.use(createMiddleware());
    });
  };

  const loadSkillCommands = (skill: SkillModule) => {
    logger().debug(`Loading skill "${skill.name}" commands..`);
    skill.commands.forEach(({ command, aliases, handler }) => {
      const logMessage = `Loading command "/${command}" with aliases "${
        aliases.join(", ")
      }" for skill "${skill.name}"`;

      logger().info(logMessage);
      bot.command([command, ...aliases], handler);
    });
  };

  const loadSkillListeners = (skill: SkillModule) => {
    logger().debug(`Loading skill "${skill.name}" listeners..`);
    skill.listeners.forEach(({ event, handler }) => {
      bot.on(event, handler);
    });
  };

  const runSkillInitializers = (skill: SkillModule) => {
    logger().debug(`Running skill "${skill.name}" initializers..`);
    return Promise.allSettled(
      skill.initializers.map((initializer) => initializer()),
    );
  };

  const compileSkillCommandsToDocs = (skill: SkillModule) => {
    const commands = skill.commands.flatMap(
      ({ command, aliases, description }) => {
        const variants = [command, ...aliases];

        return variants.map((variantCommand): BotCommand => ({
          command: variantCommand,
          description,
        }));
      },
    );

    return commands;
  };

  const loadSkills = async () => {
    let commands: BotCommand[] = [];

    await Promise.allSettled(loadedSkills.map(async (skill) => {
      logger().info(`Loading skill "${skill.name}"`);

      await runSkillInitializers(skill);

      loadSkillMiddlewares(skill);
      loadSkillCommands(skill);
      loadSkillListeners(skill);

      commands = [...commands, ...compileSkillCommandsToDocs(skill)];
    }));

    await bot.api.setMyCommands(commands);
  };

  return {
    createSessionData,
    loadSkills,
  };
};
