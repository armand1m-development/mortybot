import { assertEquals } from "@std/assert";
import {
  collectMessageMedia,
  isVideoAttachment,
  TELEGRAM_MAX_DOWNLOAD_BYTES,
} from "./collectMessageMedia.ts";
import type { MessageWithMedia } from "./types.ts";

const message = (fields: Partial<MessageWithMedia>): MessageWithMedia =>
  fields as MessageWithMedia;

Deno.test("photo attachments use the largest downloadable size", () => {
  const [attachment] = collectMessageMedia(message({
    photo: [
      { file_id: "small", file_unique_id: "a", width: 90, height: 90 },
      { file_id: "large", file_unique_id: "b", width: 1280, height: 960 },
      {
        file_id: "huge",
        file_unique_id: "c",
        width: 4000,
        height: 3000,
        file_size: TELEGRAM_MAX_DOWNLOAD_BYTES + 1,
      },
    ],
    from: { id: 1, is_bot: false, first_name: "Rick", username: "armand1m" },
    caption: "look at this",
  }));

  assertEquals(attachment.kind, "photo");
  assertEquals(attachment.fileId, "large");
  assertEquals(attachment.sender, "@armand1m");
  assertEquals(attachment.caption, "look at this");
  assertEquals(attachment.fromReply, undefined);
});

Deno.test("replied-to media is marked as such", () => {
  const [attachment] = collectMessageMedia(
    message({
      photo: [{ file_id: "p", file_unique_id: "a", width: 10, height: 10 }],
      from: { id: 2, is_bot: false, first_name: "Morty" },
    }),
    { fromReply: true },
  );

  assertEquals(attachment.fromReply, true);
  assertEquals(attachment.sender, "Morty");
});

Deno.test("videos carry their duration and cover frame", () => {
  const [attachment] = collectMessageMedia(message({
    video: {
      file_id: "v",
      file_unique_id: "v",
      width: 1920,
      height: 1080,
      duration: 12,
      file_size: 4_000,
      mime_type: "video/mp4",
      thumbnail: {
        file_id: "thumb",
        file_unique_id: "t",
        width: 320,
        height: 180,
      },
    },
  }));

  assertEquals(attachment.kind, "video");
  assertEquals(attachment.durationSeconds, 12);
  assertEquals(attachment.thumbnailFileId, "thumb");
  assertEquals(isVideoAttachment(attachment), true);
});

Deno.test("animated stickers fall back to their thumbnail frame", () => {
  const [attachment] = collectMessageMedia(message({
    sticker: {
      file_id: "sticker",
      file_unique_id: "s",
      type: "regular",
      width: 512,
      height: 512,
      is_animated: true,
      is_video: false,
      thumbnail: {
        file_id: "sticker-thumb",
        file_unique_id: "st",
        width: 128,
        height: 128,
      },
    },
  }));

  assertEquals(attachment.kind, "sticker");
  assertEquals(attachment.fileId, "sticker-thumb");
});

Deno.test("only image and video documents are worth downloading", () => {
  assertEquals(
    collectMessageMedia(message({
      document: {
        file_id: "d",
        file_unique_id: "d",
        mime_type: "application/pdf",
      },
    })),
    [],
  );

  const [image] = collectMessageMedia(message({
    document: {
      file_id: "d",
      file_unique_id: "d",
      mime_type: "image/png",
    },
  }));
  assertEquals(image.kind, "document");

  const [video] = collectMessageMedia(message({
    document: {
      file_id: "d",
      file_unique_id: "d",
      mime_type: "video/quicktime",
    },
  }));
  assertEquals(video.kind, "video");
  assertEquals(isVideoAttachment(video), true);
});

Deno.test("messages without media yield nothing", () => {
  assertEquals(collectMessageMedia(undefined), []);
  assertEquals(collectMessageMedia(message({ caption: "just text" })), []);
});
