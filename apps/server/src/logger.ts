import { pino } from "pino";
import { env } from "./env";

export const logger = pino(
    env.NODE_ENV === "development"
        ? {
              level: env.LOG_LEVEL,
              transport: { target: "pino-pretty", options: { colorize: true } },
          }
        : { level: env.LOG_LEVEL },
);
