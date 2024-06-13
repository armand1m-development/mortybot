import { resolve } from "std/path/posix.ts";
import type { Skill } from "/src/skills/skills.ts";
import { SkillModule } from "./types/SkillModule.ts";

export const loadSkillModule = async (skillName: Skill) => {
  const skillModule = await import(
    resolve(Deno.cwd(), `./src/skills/${skillName}/mod.ts`)
  );

  if (!skillModule) {
    throw new Error(
      `Failed to load skill module named "${skillName}". Make sure it matches the schema needed.`,
    );
  }

  if (skillModule.default) {
    return skillModule.default as SkillModule;
  }

  return skillModule as SkillModule;
};
