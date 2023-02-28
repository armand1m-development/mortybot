import { resolve } from "std/path/posix.ts";
import { getLogger } from "std/log/mod.ts";
import { Bot } from "grammy/mod.ts";
import { BotContext, SessionData } from "/src/context/mod.ts";
import { SkillModule } from "./types/SkillModule.ts";
import type { Skill } from "./skills.ts";
import { BotCommand } from "grammy/types.ts";

const logger = () => getLogger("skillModules");

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
      logger().info(`Running session initializer for skill "${skill.name}"`);
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
    skill.middlewares.forEach((createMiddleware) => {
      logger().info(`Loading middlewares for skill "${skill.name}"`);

      // TODO: consider properties to be injected
      // in every middleware loader, to enhance flexibility
      bot.use(createMiddleware());
    });
  };

  const loadSkillCommands = (skill: SkillModule) => {
    skill.commands.forEach(({ command, aliases, handler }) => {
      const logMessage = `Loading command "/${command}" with aliases "${
        aliases.join(", ")
      }" for skill "${skill.name}"`;

      logger().info(logMessage);
      bot.command([command, ...aliases], handler);
    });
  };

  const loadSkillListeners = (skill: SkillModule) => {
    skill.listeners.forEach(({ event, handler }) => {
      bot.on(event, handler);
    });
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

    loadedSkills.forEach((skill) => {
      logger().info(`Loading skill "${skill.name}"`);
      loadSkillMiddlewares(skill);
      loadSkillCommands(skill);
      loadSkillListeners(skill);
      commands = [...commands, ...compileSkillCommandsToDocs(skill)];
    });

    await bot.api.setMyCommands(commands);
  };

  return {
    createSessionData,
    loadSkills,
  };
};
