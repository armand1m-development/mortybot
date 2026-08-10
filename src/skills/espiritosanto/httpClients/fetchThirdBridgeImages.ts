const THIRD_BRIDGE_URL = "https://terceiraponte.ceturb.es.gov.br/";
const TOKEN_ENDPOINT = new URL("api/auth/token", THIRD_BRIDGE_URL);
export const THIRD_BRIDGE_REQUEST_TIMEOUT_MS = 10_000;

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

const fetchCameraResponses = (token: string): Promise<CameraResponse[]> =>
  Promise.all(
    CAMERAS.map(async (camera) => ({
      camera,
      response: await fetch(
        new URL(`api/imagem/${camera.id}`, THIRD_BRIDGE_URL),
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(THIRD_BRIDGE_REQUEST_TIMEOUT_MS),
        },
      ),
    })),
  );

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

export const fetchThirdBridgeImages = async (): Promise<
  ThirdBridgeCameraImage[]
> => {
  let token = await fetchAccessToken();
  let cameraResponses = await fetchCameraResponses(token);

  if (cameraResponses.some(({ response }) => response.status === 401)) {
    token = await fetchAccessToken();
    cameraResponses = await fetchCameraResponses(token);
  }

  return await Promise.all(cameraResponses.map(readCameraImage));
};

export type FetchThirdBridgeImagesFunction = typeof fetchThirdBridgeImages;
