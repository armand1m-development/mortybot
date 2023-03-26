import { intersect } from "/src/utilities/set/intersect.ts";
import { FilterSessionData } from "../sessionData/types.ts";

export const isExactMatch = (
  text: string,
  session: FilterSessionData,
) => {
  const textMatchesFilter = session.filters.get(text);
  return Boolean(textMatchesFilter?.active && !textMatchesFilter?.isLoud);
};

export const hasLoudMatches = (
  text: string,
  session: FilterSessionData,
) => {
  const words = new Set(text.split(" "));
  const filterEntries = Object.fromEntries(session.filters);
  const filterTriggers = new Set(Object.keys(filterEntries));

  const intersection = intersect(words, filterTriggers)
    .filter((trigger) => {
      const filter = session.filters.get(trigger)!;
      return filter.isLoud === true && filter.active;
    });

  const commandsFoundInText = [...filterTriggers]
    .filter((trigger) => {
      const filter = session.filters.get(trigger)!;
      return text.includes(filter.filterTrigger) && filter.active &&
        filter.isLoud;
    });

  const matches = new Set([
    ...intersection,
    ...commandsFoundInText,
  ]);

  return {
    matches,
  };
};
