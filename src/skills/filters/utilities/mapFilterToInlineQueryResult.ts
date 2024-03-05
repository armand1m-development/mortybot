import { match } from "ts-pattern";
import { InlineQueryResult } from "grammy/types.ts";
import { Filter } from "../sessionData/types.ts";

export const mapFilterToInlineQueryResult = (
  filter: Filter,
): InlineQueryResult => {
  return match(filter.message)
    // .with(
    //   { video: P.not(undefined) },
    //   ({ video, caption, captionEntities }): InlineQueryResult => ({
    //     type: "video",
    //     id: crypto.randomUUID(),
    //     video_file_id: video.fileId,
    //     title: filter.filterTrigger,
    //     description: caption,
    //     caption_entities: captionEntities,
    //     caption: caption,
    //     input_message_content: {
    //       message_text: filter.message.caption || filter.filterTrigger,
    //       entities: filter.message.captionEntities,
    //     },
    //   }),
    // )
    // .with(
    //   { audio: P.not(undefined) },
    //   ({ audio, caption, captionEntities }): InlineQueryResult => ({
    //     type: "audio",
    //     id: crypto.randomUUID(),
    //     audio_file_id: audio.fileId,
    //     title: filter.filterTrigger,
    //     caption_entities: captionEntities,
    //     caption: caption,
    //     input_message_content: {
    //       message_text: filter.message.caption || filter.filterTrigger,
    //       entities: filter.message.captionEntities,
    //     },
    //   }),
    // )
    // .with(
    //   { image: P.not(undefined) },
    //   ({ image, caption, captionEntities }): InlineQueryResult => ({
    //     type: "photo",
    //     id: crypto.randomUUID(),
    //     photo_file_id: image.fileId,
    //     title: filter.filterTrigger,
    //     description: caption || filter.filterTrigger,
    //     caption_entities: captionEntities,
    //     caption: caption || filter.filterTrigger,
    //     input_message_content: {
    //       message_text: filter.message.caption || filter.filterTrigger,
    //       entities: filter.message.captionEntities,
    //     },
    //   }),
    // )
    // .with(
    //   { voice: P.not(undefined) },
    //   ({ voice, caption }): InlineQueryResult => ({
    //     type: "voice",
    //     id: crypto.randomUUID(),
    //     voice_file_id: voice.fileId,
    //     title: filter.filterTrigger,
    //     caption,
    //     input_message_content: {
    //       message_text: filter.message.caption || filter.filterTrigger,
    //       entities: filter.message.captionEntities,
    //     },
    //   }),
    // )
    // .with(
    //   { videoNote: P.not(undefined) },
    //   ({ videoNote, caption, captionEntities }): InlineQueryResult => ({
    //     type: "video",
    //     id: crypto.randomUUID(),
    //     video_file_id: videoNote.fileId,
    //     title: filter.filterTrigger,
    //     description: caption,
    //     caption,
    //     caption_entities: captionEntities,
    //     input_message_content: {
    //       message_text: filter.message.caption || filter.filterTrigger,
    //       entities: filter.message.captionEntities,
    //     },
    //   }),
    // )
    // .with(
    //   { animation: P.not(undefined) },
    //   ({ animation, caption }): InlineQueryResult => ({
    //     type: "gif",
    //     id: crypto.randomUUID(),
    //     gif_file_id: animation.fileId,
    //     title: filter.filterTrigger,
    //     caption,
    //     input_message_content: {
    //       message_text: filter.message.caption || filter.filterTrigger,
    //       entities: filter.message.captionEntities,
    //     },
    //   }),
    // )
    // .with(
    //   { document: P.not(undefined) },
    //   ({ document, caption, captionEntities }): InlineQueryResult => ({
    //     type: "document",
    //     document_file_id: document.fileId,
    //     id: crypto.randomUUID(),
    //     title: filter.filterTrigger,
    //     caption,
    //     caption_entities: captionEntities,
    //     input_message_content: {
    //       message_text: filter.message.caption || filter.filterTrigger,
    //       entities: filter.message.captionEntities,
    //     },
    //   }),
    // )
    .otherwise((): InlineQueryResult => {
      const caption = filter.message.caption
        ? filter.message.caption
        : filter.filterTrigger;

      return {
        type: "article",
        id: crypto.randomUUID(),
        title: filter.filterTrigger,
        // description: caption,
        input_message_content: {
          message_text: caption,
          entities: filter.message.captionEntities,
        },
      };
    });
};
