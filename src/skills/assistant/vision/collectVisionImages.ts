import { getLogger } from "@std/log";
import { isDownloadable, isVideoAttachment } from "./collectMessageMedia.ts";
import { extractVideoFrames } from "./extractVideoFrames.ts";
import { prepareVisionImage } from "./prepareImage.ts";
import type { MediaAttachment, VisionImage } from "./types.ts";

const logger = () => getLogger();

export type TelegramFileDownloader = (fileId: string) => Promise<Uint8Array>;

export interface CollectVisionImagesOptions {
  /** Hard ceiling on images per turn, across every attachment. */
  maxImages: number;
  /** Frames sampled from each video, budget permitting. */
  videoFrames: number;
  extractFrames?: typeof extractVideoFrames;
  prepare?: typeof prepareVisionImage;
}

const KIND_LABELS: Record<MediaAttachment["kind"], string> = {
  photo: "Photo",
  video: "Video",
  animation: "GIF",
  video_note: "Video note",
  sticker: "Sticker",
  document: "Image",
};

/**
 * Downloads and normalizes everything the vision model is going to look at.
 *
 * A failure on one attachment is logged and skipped rather than thrown: a
 * corrupt sticker in an album is no reason to leave the user without an answer
 * about the photo next to it.
 */
export const collectVisionImages = async (
  download: TelegramFileDownloader,
  attachments: MediaAttachment[],
  options: CollectVisionImagesOptions,
): Promise<VisionImage[]> => {
  const {
    maxImages,
    videoFrames,
    extractFrames = extractVideoFrames,
    prepare = prepareVisionImage,
  } = options;

  const images: VisionImage[] = [];
  const seen = new Map<MediaAttachment["kind"], number>();

  for (const attachment of attachments) {
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      break;
    }

    const ordinal = (seen.get(attachment.kind) ?? 0) + 1;
    seen.set(attachment.kind, ordinal);
    const sameKind = attachments.filter((other) =>
      other.kind === attachment.kind
    ).length;
    const name = sameKind > 1
      ? `${KIND_LABELS[attachment.kind]} ${ordinal}`
      : KIND_LABELS[attachment.kind];

    try {
      if (isVideoAttachment(attachment)) {
        const frames = await collectVideoFrames(
          download,
          attachment,
          Math.min(videoFrames, remaining),
          extractFrames,
        );

        for (const [index, frame] of frames.entries()) {
          images.push(
            await prepare(
              frame,
              frames.length > 1
                ? `${name} frame ${index + 1} of ${frames.length}`
                : `${name} frame`,
            ),
          );
        }
        continue;
      }

      if (!isDownloadable(attachment)) {
        logger().debug(
          `Skipping a ${attachment.kind} that is too large to download.`,
        );
        continue;
      }

      const bytes = await download(attachment.fileId);
      images.push(await prepare(bytes, name, attachment.mimeType));
    } catch (error) {
      logger().warn(`Failed to prepare a ${attachment.kind} for analysis.`);
      logger().warn(error);
    }
  }

  return images;
};

/**
 * Samples a video, falling back to the cover frame Telegram sent with it.
 *
 * The fallback is what keeps oversized videos and ffmpeg-less deployments
 * useful: one frame plus the caption still answers most questions about a clip.
 */
const collectVideoFrames = async (
  download: TelegramFileDownloader,
  attachment: MediaAttachment,
  frames: number,
  extractFrames: typeof extractVideoFrames,
): Promise<Uint8Array[]> => {
  if (isDownloadable(attachment)) {
    try {
      const bytes = await download(attachment.fileId);
      const sampled = await extractFrames(bytes, {
        frames,
        ...(attachment.durationSeconds
          ? { durationSeconds: attachment.durationSeconds }
          : {}),
      });
      if (sampled.length > 0) {
        return sampled;
      }
    } catch (error) {
      logger().warn("Failed to download a video for frame sampling.");
      logger().warn(error);
    }
  }

  if (!attachment.thumbnailFileId) {
    return [];
  }

  return [await download(attachment.thumbnailFileId)];
};
