import sharp from "sharp";
import { ParsedQuery } from "querystring";
import { MemeTemplateParam } from "../sessionData/types.ts";
import { createOverlayContext } from "./overlay/overlay.ts";

export interface RendererProps {
  /** Buffer containing JPEG, PNG, WebP, AVIF, GIF, SVG, TIFF or raw pixel image data. */
  imageBuffer: ArrayBuffer;
  avatarBuffer: ArrayBuffer | null;
  params: MemeTemplateParam[];
  texts: ParsedQuery<string>;
  debug?: boolean;
}

export const renderer = async (
  { imageBuffer, avatarBuffer, params, texts, debug = false }: RendererProps,
) => {
  const sharpInstance = sharp(imageBuffer, {});
  const metadata = await sharpInstance.metadata();
  const { intoOverlay } = createOverlayContext({ metadata, texts, debug });
  const overlays = params.map(intoOverlay);
  if (avatarBuffer !== null) {
    const avatarParams = params.filter((param) => param.name === "avatar")[0];

    // Calculate the maximum width and height for the overlay image
    const maxWidth = avatarParams.width;
    const maxHeight = avatarParams.height;

    const avatarSharpInstance = sharp(avatarBuffer, {});
    const avatarMetadata = await avatarSharpInstance.metadata();

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

    const resized = await avatarSharpInstance.resize({
      width: newWidth,
      height: newHeight,
      fit: "inside",
    }).toBuffer();

    const centeredX = avatarParams.x + Math.floor((maxWidth - newWidth) / 2);
    const centeredY = avatarParams.y + Math.floor((maxHeight - newHeight) / 2);

    overlays.push({
      input: resized,
      left: centeredX,
      top: centeredY,
    });
  }
  const image = await sharpInstance.composite(overlays).jpeg().toBuffer();
  return image;
};
