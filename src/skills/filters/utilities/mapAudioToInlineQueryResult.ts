import { InlineQueryResult } from "grammy/types.ts";
import { Audio } from "../sessionData/types.ts";

export const mapAudioToInlineQueryResult = (
  audio: Audio,
): InlineQueryResult => ({
  type: "audio",
  audio_url: `https://mortybot.fly.dev:3000/audio/${audio.id}`,
  id: audio.id,
  title: audio.name,
  input_message_content: {
    message_text: audio.name,
  },
});
