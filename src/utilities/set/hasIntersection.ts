import { intersect } from "./intersect.ts";

/**
 * Checks if there is an intersection
 * between the primary and secondary sets
 */
export const hasIntersection = <T>(
  primary: Set<T>,
  secondary: Set<T>,
) => {
  return intersect(primary, secondary).length > 0;
};
