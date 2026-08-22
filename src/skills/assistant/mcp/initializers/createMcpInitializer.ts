import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";
import { initMcpRegistry } from "../registry.ts";

export const createMcpInitializer = async (
  configuration: Configuration,
): Promise<void> => {
  await initMcpRegistry(configuration);
};
