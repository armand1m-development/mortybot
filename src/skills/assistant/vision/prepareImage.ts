import sharp from "sharp";
import { getLogger } from "@std/log";
import { encodeBase64 } from "@std/encoding/base64";
import type { VisionImage } from "./types.ts";

const logger = () => getLogger();

/**
 * Longest edge handed to the vision model.
 *
 * Vision models tile an image into fixed-size patches, so pixels are paid for
 * in prompt tokens. A phone photo downscaled to this still shows everything a
 * description needs, at a fraction of the tokens of the original.
 */
export const VISION_MAX_DIMENSION = 1024;

const JPEG_QUALITY = 80;

/**
 * Normalizes arbitrary image bytes into a modest JPEG.
 *
 * Falls back to the original bytes when the decode fails, so an exotic format
 * the model might still understand is not dropped on sharp's behalf.
 */
export const prepareVisionImage = async (
  bytes: Uint8Array,
  label: string,
  mimeType = "image/jpeg",
): Promise<VisionImage> => {
  try {
    const resized = await sharp(bytes)
      .rotate()
      .resize({
        width: VISION_MAX_DIMENSION,
        height: VISION_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    return { bytes: new Uint8Array(resized), mimeType: "image/jpeg", label };
  } catch (error) {
    logger().warn(`Failed to normalize ${label} for the vision model.`);
    logger().warn(error);
    return { bytes, mimeType, label };
  }
};

/** Inline data URI, which is how OpenAI-compatible APIs accept raw images. */
export const toDataUri = (image: VisionImage): string =>
  `data:${image.mimeType};base64,${encodeBase64(image.bytes)}`;
