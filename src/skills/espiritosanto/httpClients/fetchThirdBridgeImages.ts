const THIRD_BRIDGE_URL = "https://terceiraponte.ceturb.es.gov.br/";
const TOKEN_ENDPOINT = new URL("api/auth/token", THIRD_BRIDGE_URL);
export const THIRD_BRIDGE_REQUEST_TIMEOUT_MS = 10_000;
export const THIRD_BRIDGE_CAMERA_TIMEOUT_MS = 20_000;
const CAMERA_ATTEMPTS = 3;
const CAMERA_RETRY_DELAY_MS = 400;

const CAMERAS = [
  { id: "Subida_Vix", alt: "Subida sentido Vitória" },
  { id: "Descida_Vix", alt: "Descida sentido Vitória" },
  { id: "Subida_VilaVelha", alt: "Subida sentido Vila Velha" },
  { id: "Descida_VilaVelha", alt: "Descida sentido Vila Velha" },
] as const;

const extensionsByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface ThirdBridgeCameraImage {
  alt: string;
  bytes: Uint8Array;
  extension: string;
  mimeType: string;
}

/** A camera that failed every attempt; carried so callers can degrade gracefully. */
export interface ThirdBridgeCameraFailure {
  camera: (typeof CAMERAS)[number];
  error: unknown;
}

export interface ThirdBridgeFetchResult {
  images: ThirdBridgeCameraImage[];
  failures: ThirdBridgeCameraFailure[];
}

interface TokenResponse {
  token?: unknown;
}

interface CameraResponse {
  camera: (typeof CAMERAS)[number];
  response: Response;
}

const fetchAccessToken = async (): Promise<string> => {
  const response = await fetch(TOKEN_ENDPOINT, {
    signal: AbortSignal.timeout(THIRD_BRIDGE_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Third Bridge access token: HTTP ${response.status}.`,
    );
  }

  const payload = await response.json() as TokenResponse;

  if (typeof payload.token !== "string" || payload.token.trim() === "") {
    throw new Error("Third Bridge access token response is invalid.");
  }

  return payload.token;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchCameraResponse = (
  token: string,
  camera: (typeof CAMERAS)[number],
): Promise<CameraResponse> =>
  fetch(
    new URL(`api/imagem/${camera.id}`, THIRD_BRIDGE_URL),
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(THIRD_BRIDGE_CAMERA_TIMEOUT_MS),
    },
  ).then((response) => ({ camera, response }));

const fetchCameraResponses = (token: string): Promise<CameraResponse[]> =>
  Promise.all(CAMERAS.map((camera) => fetchCameraResponse(token, camera)));

const readCameraImage = async (
  { camera, response }: CameraResponse,
): Promise<ThirdBridgeCameraImage> => {
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Third Bridge camera ${camera.id}: HTTP ${response.status}.`,
    );
  }

  const mimeType = response.headers.get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  const extension = mimeType === undefined
    ? undefined
    : extensionsByMimeType[mimeType];

  if (!mimeType || !extension) {
    throw new Error(
      `Third Bridge camera ${camera.id} returned an unsupported content type.`,
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());

  if (bytes.byteLength === 0) {
    throw new Error(
      `Third Bridge camera ${camera.id} returned an empty image.`,
    );
  }

  return {
    alt: camera.alt,
    bytes,
    extension,
    mimeType,
  };
};

/**
 * Fetch one camera with retries. Transient upstream hiccups (timeouts,
 * 5xx, empty bodies) are common on the gov cameras; each camera gets its
 * own attempts so one slow camera no longer kills the whole command.
 */
const fetchCameraWithRetries = async (
  token: string,
  camera: (typeof CAMERAS)[number],
): Promise<ThirdBridgeCameraImage> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= CAMERA_ATTEMPTS; attempt++) {
    try {
      return await readCameraImage(await fetchCameraResponse(token, camera));
    } catch (error) {
      lastError = error;
      if (attempt < CAMERA_ATTEMPTS) {
        await sleep(CAMERA_RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
};

/**
 * Fetch the Third Bridge camera images.
 *
 * Resilience contract:
 * - Token: re-fetched once if any camera answers 401 (token skew); 401
 *   cameras then get per-camera retries against the fresh token.
 * - Cameras: non-401 failures are retried per camera; a camera that
 *   still fails is reported in `failures` instead of aborting everything.
 * - The caller decides how to degrade (partial media group + note).
 */
export const fetchThirdBridgeImages = async (): Promise<
  ThirdBridgeFetchResult
> => {
  let token = await fetchAccessToken();
  let cameraResponses = await fetchCameraResponses(token);

  if (cameraResponses.some(({ response }) => response.status === 401)) {
    token = await fetchAccessToken();
    cameraResponses = await fetchCameraResponses(token);
  }

  const settled = await Promise.allSettled(
    cameraResponses.map(({ camera, response }) => {
      if (response.status === 401) {
        return fetchCameraWithRetries(token, camera);
      }

      return readCameraImage({ camera, response }).catch(async (error) => {
        // One more full attempt for a camera whose first (batch) response
        // failed on read/validation — cheap insurance against transient
        // empties, without retrying the whole batch.
        try {
          return await fetchCameraWithRetries(token, camera);
        } catch {
          throw error;
        }
      });
    }),
  );

  const images: ThirdBridgeCameraImage[] = [];
  const failures: ThirdBridgeCameraFailure[] = [];

  settled.forEach((outcome, index) => {
    if (outcome.status === "fulfilled") {
      images.push(outcome.value);
    } else {
      failures.push({ camera: CAMERAS[index], error: outcome.reason });
    }
  });

  return { images, failures };
};

export type FetchThirdBridgeImagesFunction = typeof fetchThirdBridgeImages;
