import { Router } from "oak";
import { getMcpRegistry } from "../mcp/registry.ts";

export const createAssistantRouter = () => {
  const router = new Router();

  router.get("/health", (ctx) => {
    const health = getMcpRegistry().getHealth();
    const healthy = health.state === "ready" || health.state === "disabled";

    ctx.response.status = healthy ? 200 : 503;
    ctx.response.body = health;
  });

  return router;
};
