import { assertEquals } from "@std/assert";
import { skills } from "/src/skills/skills.ts";
import { loadSkillModule } from "./loadSkill.ts";

Deno.test("loads every configured skill module", async () => {
  for (const skill of skills) {
    const skillModule = await loadSkillModule(skill);
    assertEquals(skillModule.name, skill);
  }
});
