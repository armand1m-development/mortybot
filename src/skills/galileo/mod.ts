import { nextIssPasses } from "./commands/nextIssPasses.ts";
import {
  assistantToolObjectSchema,
  createAssistantTool,
} from "/src/platform/skillModules/assistantTool.ts";
import { createN2yoMiddleware } from "./middleware/createN2yoMiddleware/mod.ts";
import type { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";

const skillModule: SkillModule = {
  name: "galileo",
  description:
    "Commands to get information about the International Space Station location.",
  initializers: [],
  middlewares: [createN2yoMiddleware],
  commands: [
    {
      command: "iss",
      aliases: [],
      description:
        "Show the prediction for the next 3 days of watchable iss passes into the informed location. Example: /iss -20.316839,-40.309921",
      handler: nextIssPasses,
      assistantTool: createAssistantTool(
        assistantToolObjectSchema({
          latitude: {
            type: "number",
            minimum: -90,
            maximum: 90,
            description:
              "Latitude. Omit both coordinates when using the location from the replied message.",
          },
          longitude: {
            type: "number",
            minimum: -180,
            maximum: 180,
            description:
              "Longitude. Omit both coordinates when using the location from the replied message.",
          },
          debug: {
            type: "boolean",
            description: "Whether to include the raw API response.",
            default: false,
          },
        }),
        (args) => {
          const latitude = args.latitude;
          const longitude = args.longitude;
          const hasLatitude = typeof latitude === "number";
          const hasLongitude = typeof longitude === "number";
          if (hasLatitude !== hasLongitude) {
            throw new TypeError(
              "ISS latitude and longitude must be provided together.",
            );
          }
          if (
            hasLatitude &&
            (latitude < -90 || latitude > 90 ||
              (longitude as number) < -180 || (longitude as number) > 180)
          ) {
            throw new TypeError("ISS coordinates are out of range.");
          }
          const position = hasLatitude ? `${latitude},${longitude}` : "";
          return args.debug === true ? `${position} debug`.trim() : position;
        },
      ),
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
