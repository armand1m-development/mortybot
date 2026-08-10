import { assertEquals, assertRejects } from "@std/assert";
import { fetchThirdBridgeImages } from "./fetchThirdBridgeImages.ts";

const CAMERA_IDS = [
  "Subida_Vix",
  "Descida_Vix",
  "Subida_VilaVelha",
  "Descida_VilaVelha",
] as const;

const getRequestUrl = (input: RequestInfo | URL): string =>
  input instanceof Request ? input.url : input.toString();

const tokenResponse = (token: string) =>
  new Response(JSON.stringify({ token }), {
    headers: { "content-type": "application/json" },
  });

const jpegResponse = (marker: number) =>
  new Response(new Uint8Array([0xff, 0xd8, marker, 0xff, 0xd9]), {
    headers: { "content-type": "image/jpeg" },
  });

Deno.test("fetches all Third Bridge cameras with one public access token", async () => {
  const originalFetch = globalThis.fetch;
  let releaseCameraResponses: () => void = () => {};
  const cameraResponseGate = new Promise<void>((resolve) => {
    releaseCameraResponses = resolve;
  });
  let markFirstCameraRequest: () => void = () => {};
  const firstCameraRequest = new Promise<void>((resolve) => {
    markFirstCameraRequest = resolve;
  });
  const requests: Array<{
    url: string;
    authorization: string | null;
    signal: AbortSignal | null | undefined;
  }> = [];

  globalThis.fetch = ((input, init) => {
    const url = getRequestUrl(input);
    requests.push({
      url,
      authorization: new Headers(init?.headers).get("authorization"),
      signal: init?.signal,
    });

    if (url.endsWith("/api/auth/token")) {
      return Promise.resolve(tokenResponse("public-token"));
    }

    const cameraIndex = CAMERA_IDS.findIndex((id) => url.endsWith(`/${id}`));
    if (cameraIndex === 0) {
      markFirstCameraRequest();
    }

    return cameraResponseGate.then(() => jpegResponse(cameraIndex));
  }) as typeof fetch;

  try {
    const imagesPromise = fetchThirdBridgeImages();
    await firstCameraRequest;
    const concurrentCameraRequests = requests.length - 1;
    releaseCameraResponses();
    const images = await imagesPromise;

    assertEquals(concurrentCameraRequests, CAMERA_IDS.length);
    assertEquals(requests.length, 5);
    assertEquals(
      requests.slice(1).map(({ url }) => url.split("/").at(-1)),
      [...CAMERA_IDS],
    );
    assertEquals(
      requests.slice(1).map(({ authorization }) => authorization),
      CAMERA_IDS.map(() => "Bearer public-token"),
    );
    assertEquals(
      requests.map(({ signal }) => signal instanceof AbortSignal),
      [true, true, true, true, true],
    );
    assertEquals(
      images.map(({ bytes }) => [...bytes]),
      CAMERA_IDS.map((_, index) => [0xff, 0xd8, index, 0xff, 0xd9]),
    );
    assertEquals(
      images.map(({ extension, mimeType }) => ({ extension, mimeType })),
      CAMERA_IDS.map(() => ({
        extension: "jpg",
        mimeType: "image/jpeg",
      })),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("refreshes the Third Bridge token once after unauthorized images", async () => {
  const originalFetch = globalThis.fetch;
  let tokenRequests = 0;
  const imageAuthorizations: Array<string | null> = [];

  globalThis.fetch = ((input, init) => {
    const url = getRequestUrl(input);

    if (url.endsWith("/api/auth/token")) {
      tokenRequests += 1;
      return Promise.resolve(tokenResponse(`token-${tokenRequests}`));
    }

    const authorization = new Headers(init?.headers).get("authorization");
    imageAuthorizations.push(authorization);

    return Promise.resolve(
      authorization === "Bearer token-1"
        ? new Response(null, { status: 401 })
        : jpegResponse(1),
    );
  }) as typeof fetch;

  try {
    const images = await fetchThirdBridgeImages();

    assertEquals(tokenRequests, 2);
    assertEquals(imageAuthorizations, [
      ...CAMERA_IDS.map(() => "Bearer token-1"),
      ...CAMERA_IDS.map(() => "Bearer token-2"),
    ]);
    assertEquals(images.length, CAMERA_IDS.length);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("rejects invalid Third Bridge token and image responses", async (t) => {
  const originalFetch = globalThis.fetch;

  try {
    await t.step("missing token", async () => {
      globalThis.fetch = (() =>
        Promise.resolve(
          new Response(JSON.stringify({}), {
            headers: { "content-type": "application/json" },
          }),
        )) as typeof fetch;

      await assertRejects(
        fetchThirdBridgeImages,
        Error,
        "access token response is invalid",
      );
    });

    await t.step("unsupported image content type", async () => {
      globalThis.fetch = ((input) =>
        Promise.resolve(
          getRequestUrl(input).endsWith("/api/auth/token")
            ? tokenResponse("public-token")
            : new Response("not an image", {
              headers: { "content-type": "text/plain" },
            }),
        )) as typeof fetch;

      await assertRejects(
        fetchThirdBridgeImages,
        Error,
        "returned an unsupported content type",
      );
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
