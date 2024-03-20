import { resolve } from "std/path/posix.ts";
import { getLogger } from "std/log/mod.ts";
import { Migrations } from "grammy/mod.ts";
import type { Skill } from "/src/skills/skills.ts";
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

export const setupSkillMigrationLoader = async (
  skills: readonly Skill[],
) => {
  const loadedSkills = await Promise.all(skills.map(loadSkill));

  const loadSkillMigrations = () => {
    let migrations: Migrations = {};

    for (const skill of loadedSkills) {
      try {
        logger().debug(`Loading migrations for skill "${skill.name}"`);

        migrations = {
          ...migrations,
          ...skill.migrations,
        };
      } catch (error) {
        logger().error(error);
      }
    }

    return migrations;
  };

  return {
    loadSkillMigrations,
  };
};
