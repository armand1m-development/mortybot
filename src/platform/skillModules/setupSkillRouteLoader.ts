import type { Router } from "oak";
import type { Skill } from "/src/skills/skills.ts";
import { loadSkillModule } from "./loadSkill.ts";
import { getLogger } from "std/log/mod.ts";

const logger = () => getLogger();

export const setupSkillRouteLoader = async (
  skills: readonly Skill[],
  mainRouter: Router,
) => {
  const loadedSkills = await Promise.all(skills.map(loadSkillModule));

  loadedSkills.forEach((skill) => {
    if (skill.router !== undefined && skill.router !== null) {
      logger().debug(
        `Loading skill "${skill.name}" routes at /${skill.name}..`,
      );

      const routes = skill.router.entries();

      for (const [route] of routes) {
        const method = route.methods.filter((method) => method !== "HEAD")[0];
        logger().debug(
          `Registering "${skill.name}" route: ${method} /${skill.name}${route.path}..`,
        );
      }

      mainRouter.use(
        `/${skill.name}`,
        skill.router.routes(),
        skill.router.allowedMethods(),
      );
    }
  });
};
