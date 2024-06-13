import { getLogger } from "std/log/mod.ts";
import { Migrations } from "grammy/mod.ts";
import type { Skill } from "/src/skills/skills.ts";
import { loadSkillModule } from "./loadSkill.ts";

const logger = () => getLogger();

export const setupSkillMigrationLoader = async (
  skills: readonly Skill[],
) => {
  const loadedSkills = await Promise.all(skills.map(loadSkillModule));

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
