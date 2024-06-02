import { resolve } from "std/path/posix.ts";
import type { Skill } from "/src/skills/skills.ts";
import { SkillModule } from "./types/SkillModule.ts";

export const loadSkill = async (skillName: Skill) => {
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