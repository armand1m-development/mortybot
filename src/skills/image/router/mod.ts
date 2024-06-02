import { Router } from "oak";
import * as path from "std/path/mod.ts";
import { MemeTemplateEntry } from "/src/skills/image/sessionData/types.ts";
import { reviverToObject } from "/src/utilities/jsonParsing.ts";
import { Configuration } from "/src/platform/configuration/middlewares/types.ts";

async function readJsonFile(filePath: string) {
  const jsonContent = await Deno.readTextFile(filePath);
  const data = JSON.parse(jsonContent, reviverToObject);
  return data;
}

const loadTemplateData = async (configuration: Configuration) => {
  const dataBase = await readJsonFile(
    path.join(
      configuration.dataPath,
      `/sessions/`,
      configuration.mainMemeTemplateChatSessionPath,
    ),
  );
  const templates: Record<string, MemeTemplateEntry> =
    dataBase.__d.memeTemplates;
  return templates;
};

export const createRouter = () => {
  const router = new Router();

  router.get("/memeTemplates", async (ctx) => {
    const templates = await loadTemplateData(ctx.state.configuration);
    ctx.response.body = templates;
  });

  router.get("/memeTemplates/:templateName", async (ctx) => {
    const templates = await loadTemplateData(ctx.state.configuration);
    const template = templates[ctx.params.templateName];

    if (!template) {
      ctx.throw(404, `Template "${ctx.params.templateName}" not found`);
      return;
    }

    ctx.response.body = template;
  });

  return router;
};
