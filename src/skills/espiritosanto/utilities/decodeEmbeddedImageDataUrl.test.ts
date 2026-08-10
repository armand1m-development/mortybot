import { assertEquals, assertThrows } from "@std/assert";
import { decodeEmbeddedImageDataUrl } from "./decodeEmbeddedImageDataUrl.ts";

Deno.test("decodes an embedded JPEG camera image", () => {
  const image = decodeEmbeddedImageDataUrl(
    "data:image/jpeg;base64,/9j/2Q==",
  );

  assertEquals(image.mimeType, "image/jpeg");
  assertEquals(image.extension, "jpg");
  assertEquals(image.bytes, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
});

Deno.test("rejects non-image and non-base64 data URLs", () => {
  assertThrows(
    () => decodeEmbeddedImageDataUrl("data:text/plain;base64,SGVsbG8="),
    TypeError,
    "Invalid embedded camera image",
  );
  assertThrows(
    () => decodeEmbeddedImageDataUrl("https://example.com/camera.jpg"),
    TypeError,
    "Invalid embedded camera image",
  );
});
