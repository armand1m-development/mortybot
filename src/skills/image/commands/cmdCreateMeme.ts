import sharp from "sharp";
import * as queryString from "querystring";
import { InputFile } from "grammy/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

const calculateFontSize = (chunkLength: number, baseFontSize = 50): number => {
  const decreaseFactor = chunkLength ^ 1.5;
  const newFontSize = baseFontSize - (chunkLength * decreaseFactor);
  return newFontSize;
};

const splitStringIntoChunks = (
  text: string,
  characterSize: number,
  availableWidth: number,
): string[] => {
  const words = text.split(" ");
  const chunks: string[] = [];
  let currentChunk = "";
  let currentWidth = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWidth = word.length * characterSize;

    if (currentWidth + wordWidth <= availableWidth) {
      currentChunk += word + " ";
      currentWidth += wordWidth;
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = word + " ";
      currentWidth = wordWidth;
    }
  }

  if (currentChunk.trim() != "") {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

interface CommandInput {
  templateId: string;
  texts: queryString.ParsedQuery;
}

function parseCommandInput(input: string): CommandInput | null {
  const components = input.split(" ");
  const templateId = components.shift()!;
  const queryParams = components.join(" ");
  const texts = queryString.parse(queryParams);

  return {
    templateId,
    texts,
  };
}

export const cmdCreateMeme: CommandMiddleware<BotContext> = async (ctx) => {
  const debug = ctx.session.enableMemeTemplateDebug;
  const commandInput = parseCommandInput(ctx.match);

  if (!commandInput) {
    return ctx.reply(
      'Invalid input. Please use the following format: `/meme templateId top=first text&bottom=second text&balloon=third` and so on',
    );
  }

  const templates = ctx.session.memeTemplates;
  const template = templates.get(commandInput.templateId);

  if (!template) {
    return ctx.reply(
      "You provided an invalid template name. Please use one of the following: \n" +
        Object.keys(templates).join(", "),
    );
  }

  const uniqueParams = new Set(template.params.map((param) => param.name));

  if (Object.values(commandInput.texts).length !== uniqueParams.size) {
    return ctx.reply(
      `You provided an incorrect number of params for this template. Please provide the following params fo.`,
    );
  }

  const response = await fetch(template.url);
  const imageBuffer = await response.arrayBuffer();
  const sharpInstance = sharp(imageBuffer, {});
  const imageMetadata = await sharpInstance.metadata();

  const overlays = template.params.map((textParam) => {
    const paramValue = commandInput.texts[textParam.name];

    if (!paramValue || typeof paramValue !== "string") {
      throw new Error(
        `You must provide a value for the parameter ${textParam.name}`,
      );
    }

    let textWidth: number = textParam.width;
    if (textParam.x + textParam.width > imageMetadata.width!) {
      // clip text width to always fit within the image width
      textWidth = imageMetadata.width! - textParam.x;
    }

    const textHeight = textParam.height;
    let charSize = textParam.fontParams.fontSize / 2;
    let chunks = splitStringIntoChunks(paramValue, charSize, textWidth);
    const fontSize = calculateFontSize(
      chunks.length,
      textParam.fontParams.fontSize,
    );

    charSize = fontSize / 1.7;
    chunks = splitStringIntoChunks(paramValue, charSize, textWidth);

    const svgOverlay = textParam.fontParams.centralize
      ? `
      <svg width="${textWidth}" height="${textHeight}">
        ${
        debug
          ? `<rect width="${textWidth}" height="${textHeight}" x="0" y="0" fill="transparent" stroke="red" stroke-width="3" />`
          : ""
      }
        <text
          x="50%"
          font-family="${textParam.fontParams.fontFamily}"
          font-size="${fontSize}"
          fill="${textParam.fontParams.color}"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          ${
        chunks.map(
          (
            chunk,
          ) => (`<tspan x="${textWidth / 2}" dy="1.2em">${chunk}</tspan>`),
        ).join("")
      }
        </text>
      </svg>
    `
      : `
      <svg width="${textWidth}" height="${textHeight}">
        ${
        debug
          ? `<rect width="${textWidth}" height="${textHeight}" x="0" y="0" fill="transparent" stroke="red" stroke-width="3" />`
          : ""
      }
        <text
          width="${textWidth}"
          font-family="${textParam.fontParams.fontFamily}"
          font-size="${fontSize}"
          fill="${textParam.fontParams.color}"
        >
          ${
        chunks.map(
          (chunk) => (`<tspan x="0" dy="1.2em">${chunk}</tspan>`),
        ).join("")
      }
        </text>
      </svg>
    `;

    const overlay: sharp.OverlayOptions = {
      input: new TextEncoder().encode(svgOverlay),
      top: textParam.y,
      left: textParam.x,
    };

    return overlay;
  });

  const image = await sharpInstance
    .composite(overlays)
    .jpeg()
    .toBuffer();

  await ctx.replyWithPhoto(new InputFile(image));
};
