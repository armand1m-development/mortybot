import { decodeBase64 } from "@std/encoding/base64";

const EMBEDDED_IMAGE_PATTERN =
  /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

const extensionsByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface DecodedEmbeddedImage {
  bytes: Uint8Array;
  extension: string;
  mimeType: string;
}

export const decodeEmbeddedImageDataUrl = (
  dataUrl: string,
): DecodedEmbeddedImage => {
  const match = EMBEDDED_IMAGE_PATTERN.exec(dataUrl);

  if (!match) {
    throw new TypeError("Invalid embedded camera image data URL.");
  }

  const [, mimeType, payload] = match;

  return {
    bytes: decodeBase64(payload),
    extension: extensionsByMimeType[mimeType],
    mimeType,
  };
};
