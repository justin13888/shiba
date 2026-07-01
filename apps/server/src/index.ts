import { serve } from "@hono/node-server";
import { createDb } from "./db";
import { env } from "./env";
import { logger } from "./logger";
import { createSyncServer } from "./sync";

const db = createDb(env.DB_PATH);
const { app, injectWebSocket } = createSyncServer(db, env.SHIBA_SERVER_SECRET);

const server = serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {
    logger.info(`Shiba sync server listening on :${port}`);
});
injectWebSocket(server);
