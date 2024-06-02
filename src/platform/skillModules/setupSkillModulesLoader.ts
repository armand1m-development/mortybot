import { getLogger } from "std/log/mod.ts";
import { Bot } from "grammy/mod.ts";
import { BotCommand } from "grammy/types.ts";
import { BotContext, SessionData } from "/src/context/mod.ts";
import type { Skill } from "/src/skills/skills.ts";
import { SkillModule } from "./types/SkillModule.ts";
import { loadSkill } from "./loadSkill.ts";

const logger = () => getLogger();

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

    for (const { event, handler, chatType } of skill.listeners) {
      if (chatType != undefined) {
        bot.chatType(chatType).fork().on(event, handler);
      } else {
        bot.fork().on(event, handler);
      }
    }
  };

  const loadSkillInlineQueryListeners = (skill: SkillModule) => {
    logger().debug(`Loading skill "${skill.name}" listeners..`);
    skill.inlineQueryListeners.forEach(({ handler }) => {
      bot.on("inline_query", handler);
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
          description: `${description} [skill: ${skill.name}]`,
        }));
      },
    );

    return commands;
  };

  const loadSkills = async () => {
    let commands: BotCommand[] = [];

    const result = await Promise.allSettled(loadedSkills.map(async (skill) => {
      try {
        logger().debug(`Loading skill "${skill.name}"`);

        await runSkillInitializers(skill);

        loadSkillMiddlewares(skill);
        loadSkillCommands(skill);
        loadSkillListeners(skill);
        loadSkillInlineQueryListeners(skill);

        commands = [...commands, ...compileSkillCommandsToDocs(skill)];
      } catch (e) {
        logger().error(e);
      }
    }));

    const skillLoadingReport = result.map((result, index) => {
      const skill = loadedSkills[index];
      const resumedSkill: any = { ...skill };
      resumedSkill.commands = skill.commands.map((command) =>
        `${command.command}: ${command.description}`
      );

      Object.entries(resumedSkill).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          delete resumedSkill[key];
        }

        if (value instanceof Array && value.length === 0) {
          delete resumedSkill[key];
        }

        if (value instanceof Array && value.length > 0) {
          resumedSkill[key] = value.map((v: any) => {
            if (v instanceof Function) {
              return v.name ?? v.toString();
            }

            return v;
          });
        }

        if (value instanceof Function) {
          resumedSkill[key] = value.name ?? value.toString();
        }

        if (key === "migrations") {
          resumedSkill[key] = Object.values(value as Object).map((
            migration: any,
          ) => migration.name);
        }

        if (key === "inlineQueryListeners") {
          resumedSkill[key] = (value as Array<any>).map((
            { pattern, handler },
          ) =>
            `${pattern.toString()}: ${handler?.name ?? handler?.toString()}`
          );
        }
      });

      return ({
        skill: resumedSkill,
        result,
      });
    });

    logger().debug("Skill loading report:");
    logger().debug(JSON.stringify(skillLoadingReport, null, 2));

    logger().debug("Setting bot command docs.");
    logger().debug(JSON.stringify(commands, null, 2));

    await bot.api.setMyCommands(commands);
  };

  return {
    createSessionData,
    loadSkills,
  };
};
