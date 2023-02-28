/**
 * If you add a new skill,
 * you should load it here
 *
 * TODO: check if I can generate this file
 */
export const skills = [
  "currency",
  "filters",
  "weather",
] as const;

export type Skill = typeof skills[number];
