import { intersect } from "/src/utilities/set/intersect.ts";
import { FilterSessionData } from "../sessionData/types.ts";

export const parseFilterMatches = (
  text: string,
  session: FilterSessionData,
) => {
  const words = new Set(text.split(" "));

  const filterEntries = Object.fromEntries(session.filters);
  const filterTriggers = new Set(Object.keys(filterEntries));

  const isActive = (trigger: string) => {
    const filterMessage = session.filters.get(trigger)!;
    return filterMessage.active;
  };

  const isLoud = (trigger: string) => {
    const filterMessage = session.filters.get(trigger)!;
    return filterMessage.isLoud === true;
  };

  const intersection = intersect(words, filterTriggers)
    .filter(isLoud)
    .filter(isActive);

  const commandsFoundInText = [...filterTriggers].filter((trigger) =>
    text.includes(trigger) && isActive(trigger) && isLoud(trigger)
  );

  const textMatchesFilter = session.filters.get(text);
  const isExactMatch = textMatchesFilter !== undefined &&
    textMatchesFilter.isLoud === false;

  const matches = new Set([
    ...intersection,
    ...commandsFoundInText,
  ]);

  return {
    words,
    matches,
    intersection,
    isExactMatch,
    filterTriggers,
    commandsFoundInText,
  };
};
