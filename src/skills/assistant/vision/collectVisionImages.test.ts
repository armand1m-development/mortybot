import { assertEquals } from "@std/assert";
import { collectVisionImages } from "./collectVisionImages.ts";
import { TELEGRAM_MAX_DOWNLOAD_BYTES } from "./collectMessageMedia.ts";
import type { MediaAttachment, VisionImage } from "./types.ts";

const attachment = (fields: Partial<MediaAttachment>): MediaAttachment => ({
  kind: "photo",
  fileId: "file",
  ...fields,
});

/** Skips sharp: these tests are about which bytes are chosen, not how they are encoded. */
const prepare = (
  bytes: Uint8Array,
  label: string,
  mimeType = "image/jpeg",
): Promise<VisionImage> => Promise.resolve({ bytes, mimeType, label });

const download = (fileId: string) =>
  Promise.resolve(new TextEncoder().encode(fileId));

const noFrames = () => Promise.resolve([]);

Deno.test("photos are labelled by position only when there are several", async () => {
  const single = await collectVisionImages(
    download,
    [attachment({ fileId: "a" })],
    { maxImages: 4, videoFrames: 2, prepare, extractFrames: noFrames },
  );
  assertEquals(single.map((image) => image.label), ["Photo"]);

  const album = await collectVisionImages(
    download,
    [attachment({ fileId: "a" }), attachment({ fileId: "b" })],
    { maxImages: 4, videoFrames: 2, prepare, extractFrames: noFrames },
  );
  assertEquals(album.map((image) => image.label), ["Photo 1", "Photo 2"]);
});

Deno.test("the image ceiling holds across a whole album", async () => {
  const images = await collectVisionImages(
    download,
    ["a", "b", "c", "d"].map((fileId) => attachment({ fileId })),
    { maxImages: 2, videoFrames: 2, prepare, extractFrames: noFrames },
  );

  assertEquals(images.map((image) => image.label), ["Photo 1", "Photo 2"]);
});

Deno.test("videos are sampled into frames within the remaining budget", async () => {
  const requested: number[] = [];
  const images = await collectVisionImages(
    download,
    [attachment({
      kind: "video",
      fileId: "clip",
      durationSeconds: 8,
      thumbnailFileId: "cover",
    })],
    {
      maxImages: 3,
      videoFrames: 4,
      prepare,
      extractFrames: (_bytes, options) => {
        requested.push(options.frames);
        return Promise.resolve([new Uint8Array([1]), new Uint8Array([2])]);
      },
    },
  );

  assertEquals(requested, [3]);
  assertEquals(images.map((image) => image.label), [
    "Video frame 1 of 2",
    "Video frame 2 of 2",
  ]);
});

Deno.test("a video that cannot be sampled falls back to its cover frame", async () => {
  const images = await collectVisionImages(
    download,
    [attachment({
      kind: "video",
      fileId: "clip",
      thumbnailFileId: "cover",
    })],
    { maxImages: 4, videoFrames: 4, prepare, extractFrames: noFrames },
  );

  assertEquals(images.length, 1);
  assertEquals(images[0].label, "Video frame");
  assertEquals(new TextDecoder().decode(images[0].bytes), "cover");
});

Deno.test("an oversized video still contributes its cover frame", async () => {
  const downloaded: string[] = [];
  const images = await collectVisionImages(
    (fileId) => {
      downloaded.push(fileId);
      return download(fileId);
    },
    [attachment({
      kind: "video",
      fileId: "huge",
      fileSize: TELEGRAM_MAX_DOWNLOAD_BYTES + 1,
      thumbnailFileId: "cover",
    })],
    { maxImages: 4, videoFrames: 4, prepare, extractFrames: noFrames },
  );

  assertEquals(downloaded, ["cover"]);
  assertEquals(images.length, 1);
});

Deno.test("one broken attachment does not cost the others their description", async () => {
  const images = await collectVisionImages(
    (fileId) =>
      fileId === "broken"
        ? Promise.reject(new Error("gone"))
        : download(fileId),
    [
      attachment({ fileId: "broken" }),
      attachment({ fileId: "fine" }),
    ],
    { maxImages: 4, videoFrames: 2, prepare, extractFrames: noFrames },
  );

  assertEquals(images.length, 1);
  assertEquals(new TextDecoder().decode(images[0].bytes), "fine");
});

Deno.test("an oversized photo is skipped rather than requested", async () => {
  const images = await collectVisionImages(
    download,
    [attachment({ fileSize: TELEGRAM_MAX_DOWNLOAD_BYTES + 1 })],
    { maxImages: 4, videoFrames: 2, prepare, extractFrames: noFrames },
  );

  assertEquals(images, []);
});
