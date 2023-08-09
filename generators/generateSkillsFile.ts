import { resolve } from "std/path/posix.ts";

const skillsDirectoryPath = resolve(Deno.cwd(), "./src/skills");

const skills = [];

for await (const dirEntry of Deno.readDir(skillsDirectoryPath)) {
  if (dirEntry.isDirectory) {
    skills.push(dirEntry.name);
  }
}

const code = `// THIS FILE IS AUTO-GENERATED
// RUN \`deno task generate:skills\` TO UPDATE
export const skills = [
  ${skills.map((skill) => `"${skill}"`).join(",\n  ")}
] as const;

export type Skill = typeof skills[number];
`;

const targetPath = resolve(skillsDirectoryPath, "skills.ts");
const encoder = new TextEncoder();
const data = encoder.encode(code);

await Deno.writeFile(targetPath, data);

console.log(`wrote skills file at "${targetPath}"`);
