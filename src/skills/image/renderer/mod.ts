import sharp from "sharp";
import { ParsedQuery } from "querystring";
import { MemeTemplateParam } from "../sessionData/types.ts";
import { createOverlayContext } from "./overlay/overlay.ts";

export interface RendererProps {
  /** Buffer containing JPEG, PNG, WebP, AVIF, GIF, SVG, TIFF or raw pixel image data. */
  buffer: ArrayBuffer;
  params: MemeTemplateParam[];
  texts: ParsedQuery<string>;
  debug?: boolean;
}

export const renderer = async (
  { buffer, params, texts, debug = false }: RendererProps,
) => {
  const sharpInstance = sharp(buffer, {});
  const metadata = await sharpInstance.metadata();
  const { intoOverlay } = createOverlayContext({ metadata, texts, debug });
  const overlays = params.map(intoOverlay);
  const image = await sharpInstance.composite(overlays).jpeg().toBuffer();
  return image;
};
