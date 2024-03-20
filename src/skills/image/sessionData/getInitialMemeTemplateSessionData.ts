import { MemeTemplateSessionData } from "./types.ts";

export const getInitialMemeTemplateSessionData =
  (): MemeTemplateSessionData => {
    return {
      enableMemeTemplateDebug: false,
      memeTemplates: new Map(),
    };
  };
