import { extractInstagramReel } from "./extractInstagramReel.ts";

// import { assertEquals } from "std/testing/asserts.ts";

Deno.test("extractInstagramReel", async () => {
  // const result = await extractInstagramReel("https://www.instagram.com/reel/Cy38S1Sx7YW/")
  const result = await extractInstagramReel("https://www.instagram.com/reel/CzpXoQKPtlb/")

  console.log({
    result
  })
});