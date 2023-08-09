import { HashtagChannelSessionData } from "./types.ts";

export const getInitialHashtagChannelSessionData =
  (): HashtagChannelSessionData => {
    return {
      hashtagChannels: new Map(),
    };
  };
