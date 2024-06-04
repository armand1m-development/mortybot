import { FilterSessionData } from "./types.ts";

export const getInitialFilterSessionData = (): FilterSessionData => {
  return {
    filters: new Map(),
    audioDatabase: [],
    filterSettings: {
      caseSensitive: true,
    },
  };
};
