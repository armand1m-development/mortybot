import { getLogger } from "std/log/mod.ts";
import { resolve } from "std/path/posix.ts";

const logger = () => getLogger();

export const createDownloadsFolder = async () => {
  const path = resolve(Deno.env.get("DATA_PATH")!, "./downloads");

  try {
    await Deno.stat(path);
    logger().info(`Downloads folder is in place.`);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      logger().info(`Creating ${path} folder..`);
      await Deno.mkdir(path);
    }
  }
};
