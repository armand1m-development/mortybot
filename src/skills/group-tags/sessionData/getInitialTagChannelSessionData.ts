import { TagChannelSessionData } from "./types.ts";

export const getInitialTagChannelSessionData = (): TagChannelSessionData => {
  return {
    tagChannels: new Map(),
  };
};
