import { chromium } from "playwright-core";

const THIRD_BRIDGE_URL = "https://terceiraponte.ceturb.es.gov.br/";
const CAMERA_IMAGE_SELECTOR = "img[src^='data:image/']";
const EXPECTED_CAMERA_COUNT = 4;
const PAGE_TIMEOUT_MS = 30_000;

export interface EmbeddedCameraImage {
  alt: string;
  dataUrl: string;
}

const getChromiumExecutablePath = () => {
  const configuredPath = Deno.env.get("CHROMIUM_EXECUTABLE_PATH");

  if (configuredPath) {
    return configuredPath;
  }

  if (Deno.build.os === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }

  return "/usr/bin/chromium";
};

export const fetchThirdBridgeImages = async (): Promise<
  EmbeddedCameraImage[]
> => {
  const browser = await chromium.launch({
    executablePath: getChromiumExecutablePath(),
    headless: true,
    args: Deno.build.os === "linux"
      ? ["--disable-dev-shm-usage", "--no-sandbox"]
      : [],
  });

  try {
    const page = await browser.newPage();
    const response = await page.goto(THIRD_BRIDGE_URL, {
      timeout: PAGE_TIMEOUT_MS,
      waitUntil: "domcontentloaded",
    });

    if (!response?.ok()) {
      throw new Error(
        `Failed to load Third Bridge cameras: HTTP ${response?.status()}.`,
      );
    }

    await page.waitForFunction(
      ({ expectedCount, selector }) =>
        document.querySelectorAll(selector).length >= expectedCount,
      {
        expectedCount: EXPECTED_CAMERA_COUNT,
        selector: CAMERA_IMAGE_SELECTOR,
      },
      { timeout: PAGE_TIMEOUT_MS },
    );

    const images = await page.locator(CAMERA_IMAGE_SELECTOR).evaluateAll(
      (nodes) =>
        nodes.map((node) => {
          const image = node as HTMLImageElement;
          return {
            alt: image.alt || "Terceira Ponte",
            dataUrl: image.src,
          };
        }),
    );

    if (images.length < EXPECTED_CAMERA_COUNT) {
      throw new Error(
        `Expected ${EXPECTED_CAMERA_COUNT} Third Bridge cameras, found ${images.length}.`,
      );
    }

    return images;
  } finally {
    await browser.close();
  }
};

export type FetchThirdBridgeImagesFunction = typeof fetchThirdBridgeImages;
