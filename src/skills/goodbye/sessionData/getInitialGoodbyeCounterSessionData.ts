import type { GoodbyeCounterSessionData } from "./types.ts";

export const getInitialGoodbyeCounterSessionData =
  (): GoodbyeCounterSessionData => {
    return {
      goodbyeCounter: new Map(),
    };
  };
