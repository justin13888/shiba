import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { envs } from "./env";
import { logger } from "./logger";

// Start Elysia
const app = new Elysia()
    .use(cors())
    // .use(users)
    // .use(token)
    .get("/", () => "Hello from Shiba API")
    .listen(envs.PORT);

logger.info(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
