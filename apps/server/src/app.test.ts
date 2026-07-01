import { describe, expect, it } from "vitest";
import { createApp, touchDevice } from "./app";
import { createDb } from "./db";

const make = () => createApp(createDb(":memory:"), "secret");

async function mintToken(app: ReturnType<typeof make>): Promise<string> {
    const res = await app.request("/devices", {
        method: "POST",
        headers: { authorization: "Bearer secret" },
    });
    const body = (await res.json()) as { token: string };
    return body.token;
}

describe("sync server HTTP", () => {
    it("serves health", async () => {
        expect((await make().request("/healthz")).status).toBe(200);
    });

    it("mints device tokens only with the server secret", async () => {
        const app = make();
        expect((await app.request("/devices", { method: "POST" })).status).toBe(
            401,
        );
        const token = await mintToken(app);
        expect(token).toBeTypeOf("string");
        const list = await app.request("/devices", {
            headers: { authorization: `Bearer ${token}` },
        });
        expect(list.status).toBe(200);
    });

    it("rejects unauthorized access to protected routes", async () => {
        expect((await make().request("/keys")).status).toBe(401);
    });

    it("stamps last_seen_at when a device is touched", async () => {
        const db = createDb(":memory:");
        const app = createApp(db, "secret");
        const token = await mintToken(app);
        const before = (await (
            await app.request("/devices", {
                headers: { authorization: `Bearer ${token}` },
            })
        ).json()) as { devices: { lastSeenAt: number | null }[] };
        expect(before.devices[0]?.lastSeenAt).toBeNull();

        touchDevice(db, token);

        const after = (await (
            await app.request("/devices", {
                headers: { authorization: `Bearer ${token}` },
            })
        ).json()) as { devices: { lastSeenAt: number | null }[] };
        expect(after.devices[0]?.lastSeenAt).toBeTypeOf("number");
    });

    it("stores and returns encrypted key material", async () => {
        const app = make();
        const token = await mintToken(app);
        const put = await app.request("/keys", {
            method: "PUT",
            headers: {
                authorization: `Bearer ${token}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                salt: "c2FsdA==",
                params: { algorithm: "argon2id", memoryKiB: 19456 },
                wrappedDek: "d3JhcA==",
            }),
        });
        expect(put.status).toBe(200);
        const get = await app.request("/keys", {
            headers: { authorization: `Bearer ${token}` },
        });
        const km = (await get.json()) as { wrappedDek: string };
        expect(km.wrappedDek).toBe("d3JhcA==");
    });
});
