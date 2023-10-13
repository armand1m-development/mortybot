import { GeoPosition } from "/src/skills/galileo/commands/types.ts";

export const parsePosition = (text: string): GeoPosition => {
  const [latitude, longitude] = text.split(",");
  return { latitude, longitude };
};
