import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { nanoid } from "nanoid";
import * as v from "valibot";
import type { Db } from "./db";
import { deviceTokens, keyMaterial } from "./schema";

export const hashToken = (token: string): string =>
    createHash("sha256").update(token).digest("hex");

/** Resolve a raw token to a live device id, or null. */
export function deviceForToken(db: Db, token: string): string | null {
    const row = db
        .select()
        .from(deviceTokens)
        .where(eq(deviceTokens.tokenHash, hashToken(token)))
        .get();
    return row && !row.revoked ? row.deviceId : null;
}

const bearer = (header: string | undefined): string | undefined =>
    header?.startsWith("Bearer ") ? header.slice(7) : undefined;

const KeyMaterialBody = v.object({
    salt: v.string(),
    params: v.record(v.string(), v.unknown()),
    wrappedDek: v.string(),
    recoveryWrap: v.optional(v.string()),
});

type Vars = { Variables: { deviceId: string } };

/** The HTTP surface of the sync server (the WebSocket relay is wired in index.ts). */
export function createApp(db: Db, secret: string | undefined) {
    const app = new Hono<Vars>();

    const requireAuth = createMiddleware<Vars>(async (c, next) => {
        const token = bearer(c.req.header("authorization"));
        const deviceId = token ? deviceForToken(db, token) : null;
        if (!deviceId) return c.json({ error: "unauthorized" }, 401);
        c.set("deviceId", deviceId);
        await next();
    });

    app.get("/healthz", (c) => c.json({ ok: true }));

    // Bootstrap: mint a device token using the pre-shared server secret.
    app.post("/devices", async (c) => {
        if (!secret || bearer(c.req.header("authorization")) !== secret) {
            return c.json({ error: "unauthorized" }, 401);
        }
        const body = (await c.req.json().catch(() => ({}))) as {
            name?: string;
        };
        const deviceId = nanoid();
        const token = randomBytes(24).toString("hex");
        db.insert(deviceTokens)
            .values({
                tokenHash: hashToken(token),
                deviceId,
                name: typeof body.name === "string" ? body.name : null,
                createdAt: Date.now(),
                revoked: false,
            })
            .run();
        return c.json({ deviceId, token });
    });

    app.get("/devices", requireAuth, (c) =>
        c.json({
            devices: db
                .select({
                    deviceId: deviceTokens.deviceId,
                    name: deviceTokens.name,
                    lastSeenAt: deviceTokens.lastSeenAt,
                    revoked: deviceTokens.revoked,
                })
                .from(deviceTokens)
                .all(),
        }),
    );

    app.delete("/devices/:id", requireAuth, (c) => {
        db.update(deviceTokens)
            .set({ revoked: true })
            .where(eq(deviceTokens.deviceId, c.req.param("id")))
            .run();
        return c.json({ ok: true });
    });

    app.get("/keys", requireAuth, (c) => {
        const row = db
            .select()
            .from(keyMaterial)
            .where(eq(keyMaterial.id, 1))
            .get();
        return row ? c.json(row) : c.json({ error: "not found" }, 404);
    });

    app.put("/keys", requireAuth, async (c) => {
        const parsed = v.safeParse(
            KeyMaterialBody,
            await c.req.json().catch(() => null),
        );
        if (!parsed.success) return c.json({ error: "invalid" }, 400);
        const { salt, params, wrappedDek, recoveryWrap } = parsed.output;
        const values = {
            salt,
            params: JSON.stringify(params),
            wrappedDek,
            recoveryWrap: recoveryWrap ?? null,
            updatedAt: Date.now(),
        };
        db.insert(keyMaterial)
            .values({ id: 1, ...values })
            .onConflictDoUpdate({ target: keyMaterial.id, set: values })
            .run();
        return c.json({ ok: true });
    });

    return app;
}
