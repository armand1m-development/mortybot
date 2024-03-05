import { InlineQueryResult } from "grammy/types.ts";
import { Audio } from "../sessionData/types.ts";

export const mapAudioToInlineQueryResult = (
  audio: Audio,
): InlineQueryResult => ({
  type: "audio",
  audio_url: `https://mortybot.fly.dev/audio/${audio.id}.${audio.extension}`,
  id: audio.id,
  title: audio.name,
  input_message_content: {
    message_text:
      `🎵 [${audio.name}](https://mortybot.fly.dev/audio/${audio.id}.${audio.extension})`,
    parse_mode: "Markdown",
  },
});
