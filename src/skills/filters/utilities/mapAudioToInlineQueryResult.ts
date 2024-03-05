import { InlineQueryResult } from "grammy/types.ts";
import { Audio } from "../sessionData/types.ts";

export const mapAudioToInlineQueryResult = (
  audio: Audio,
): InlineQueryResult => ({
  type: "audio",
  audio_url: `https://mortybot.fly.dev/audio/${audio.id}`,
  id: audio.id,
  title: audio.name,
});
