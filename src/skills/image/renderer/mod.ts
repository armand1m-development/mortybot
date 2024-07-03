import sharp from "sharp";
import type { ParsedQuery } from "querystring";
import type { MemeTemplateParam } from "../sessionData/types.ts";
import { createOverlayContext } from "./overlay/overlay.ts";

export interface RendererProps {
  /** Buffer containing JPEG, PNG, WebP, AVIF, GIF, SVG, TIFF or raw pixel image data. */
  templateImageBuffer: ArrayBuffer;
  replyImageBuffer: ArrayBuffer | null;
  stickerImageBuffer: ArrayBuffer | null;
  avatarBuffer: ArrayBuffer | null;
  params: MemeTemplateParam[];
  filteredParams: MemeTemplateParam[];
  texts: ParsedQuery<string>;
  debug?: boolean;
}

export const renderer = async (
  {
    templateImageBuffer,
    stickerImageBuffer,
    replyImageBuffer,
    avatarBuffer,
    params,
    filteredParams,
    texts,
    debug = false,
  }: RendererProps,
) => {
  const sharpInstance = sharp(templateImageBuffer, {});
  const metadata = await sharpInstance.metadata();
  const { intoTextOverlay } = createOverlayContext({ metadata, texts, debug });
  const overlays = filteredParams.map(intoTextOverlay);
  const pushOverlay = async (
    overlayBuffer: ArrayBuffer,
    params: MemeTemplateParam,
  ) => {
    // Calculate the maximum width and height for the overlay image
    const maxWidth = params.width;
    const maxHeight = params.height;

    const overlaySharpInstance = sharp(overlayBuffer, {});
    const avatarMetadata = await overlaySharpInstance.metadata();

    const avatarWidth = avatarMetadata.width!;
    const avatarHeight = avatarMetadata.height!;

    // Calculate scaling factors for both dimensions
    const widthScale = maxWidth / avatarWidth;
    const heightScale = maxHeight / avatarHeight;

    // Use the smaller scaling factor to maintain aspect ratio
    const scale = Math.min(widthScale, heightScale);

    // Calculate the new dimensions for the overlay image
    const newWidth = Math.floor(avatarWidth * scale);
    const newHeight = Math.floor(avatarHeight * scale);

    const resized = await overlaySharpInstance.resize({
      width: newWidth,
      height: newHeight,
      fit: "inside",
    }).toBuffer();

    const centeredX = params.x + Math.floor((maxWidth - newWidth) / 2);
    const centeredY = params.y + Math.floor((maxHeight - newHeight) / 2);

    overlays.push({
      input: resized,
      left: centeredX,
      top: centeredY,
    });
  };

  const avatarParam = params.filter((param) => param.name === "avatar")[0];

  if (avatarParam && avatarBuffer !== null) {
    await pushOverlay(avatarBuffer, avatarParam);
  }

  const stickerParam = params.filter((param) => param.name === "sticker")[0];

  if (stickerParam && stickerImageBuffer !== null) {
    await pushOverlay(stickerImageBuffer, stickerParam);
  }

  const replyPhotoParam =
    params.filter((param) => param.name === "replyPhoto")[0];

  if (replyPhotoParam && replyImageBuffer !== null) {
    await pushOverlay(replyImageBuffer, replyPhotoParam);
  }

  const overlayParam = params.filter((param) => param.name === "overlay")[0];

  const overlayImageBuffer = stickerImageBuffer ??
    replyImageBuffer ??
    avatarBuffer;

  if (overlayParam && overlayImageBuffer !== null) {
    await pushOverlay(overlayImageBuffer, overlayParam);
  }

  const image = await sharpInstance.composite(overlays).jpeg().toBuffer();

  return image;
};
