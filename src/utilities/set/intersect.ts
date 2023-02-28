/**
 * Returns the intersection between a primary and
 * secondary array.
 *
 * This implementation makes use of Set
 * to improve the speed of the intersect
 * algorithm, since Set.has() is O(1)
 * while Array.prototype.includes() is O(n)
 */
export const intersect = <T>(primary: Set<T>, secondary: Set<T>) => {
  return [...primary].filter((value) => secondary.has(value));
};
