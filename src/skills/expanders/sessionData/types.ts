import { InputFile } from "grammy/types.deno.ts";

export interface ExpanderSessionData {
  expanders: {
    enabled: boolean;
  };
}

export interface InstagramMediaMetadata {
  payload: string;
  reel?: {
    caption: string;
    buffer: InputFile;
  };
  photo?: {
    caption: string;
    buffer: InputFile;
  };
}