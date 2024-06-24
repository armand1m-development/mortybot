import type { InlineQueryResult } from "grammy/types.ts";
import type { Audio } from "../sessionData/types.ts";

export const mapAudioToInlineQueryResult = (
  audio: Audio,
): InlineQueryResult => ({
  type: "audio",
  audio_url:
    `https://mortybot.fly.dev/audio/${audio.file_name}.${audio.extension}`,
  id: audio.id,
  title: audio.name,
  caption: audio.name,
});
