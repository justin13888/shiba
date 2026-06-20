import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./env";
import { logger } from "./logger";

// The full sync relay (auth, key material, encrypted update log, WebSocket) is
// built in Phase 5. For now the server exposes only a health check so the
// monorepo builds and deploys end-to-end.
export const app = new Hono().get("/healthz", (c) => c.json({ ok: true }));

if (import.meta.url === `file://${process.argv[1]}`) {
    serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {
        logger.info(`Shiba sync server listening on :${port}`);
    });
}
