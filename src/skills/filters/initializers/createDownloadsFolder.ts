import { getLogger } from "std/log/mod.ts";
import { resolve } from "std/path/posix.ts";

const logger = () => getLogger();

export const createDownloadsFolder = async () => {
  const path = resolve(Deno.env.get("DATA_PATH")!, "./downloads");

  try {
    await Deno.stat(path);
    logger().debug(`Downloads folder is in place.`);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      logger().debug(`Creating ${path} folder..`);
      await Deno.mkdir(path);
    }
  }
};
