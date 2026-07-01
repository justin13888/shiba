import { serve } from "@hono/node-server";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { createDb } from "./db";
import { createSyncServer } from "./sync";

interface Msg {
    t: string;
    seq?: number;
    ref?: number;
    blob?: { nonce: string; ciphertext: string };
}

const opened = (ws: WebSocket): Promise<void> =>
    new Promise((resolve) => ws.on("open", () => resolve()));
const nextMsg = (ws: WebSocket): Promise<Msg> =>
    new Promise((resolve) =>
        ws.once("message", (d) => resolve(JSON.parse(String(d)) as Msg)),
    );
const untilLive = (ws: WebSocket): Promise<Msg[]> =>
    new Promise((resolve) => {
        const acc: Msg[] = [];
        const on = (d: WebSocket.RawData): void => {
            const msg = JSON.parse(String(d)) as Msg;
            acc.push(msg);
            if (msg.t === "live") {
                ws.off("message", on);
                resolve(acc);
            }
        };
        ws.on("message", on);
    });

describe("WS /sync relay", () => {
    let stop: (() => void) | undefined;
    afterEach(() => stop?.());

    async function start(): Promise<{
        port: number;
        mint: () => Promise<string>;
        open: (token: string) => WebSocket;
    }> {
        const db = createDb(":memory:");
        const { app, injectWebSocket } = createSyncServer(db, "secret");
        const { server, port } = await new Promise<{
            server: ReturnType<typeof serve>;
            port: number;
        }>((resolve) => {
            const s = serve({ fetch: app.fetch, port: 0 }, (info) =>
                resolve({ server: s, port: info.port }),
            );
        });
        injectWebSocket(server);
        stop = () => server.close();
        return {
            port,
            mint: async () => {
                const r = await app.request("/devices", {
                    method: "POST",
                    headers: { authorization: "Bearer secret" },
                });
                return ((await r.json()) as { token: string }).token;
            },
            open: (token) =>
                new WebSocket(`ws://127.0.0.1:${port}/sync?token=${token}`),
        };
    }

    it("acks a push and fans the opaque blob out to peers", async () => {
        const { mint, open } = await start();
        const a = open(await mint());
        const b = open(await mint());
        await Promise.all([opened(a), opened(b)]);

        const ack = nextMsg(a);
        const relayed = nextMsg(b);
        a.send(
            JSON.stringify({
                t: "push",
                ref: 7,
                blob: { nonce: "n", ciphertext: "c1" },
            }),
        );
        expect(await ack).toMatchObject({ t: "ack", ref: 7 });
        expect(await relayed).toMatchObject({
            t: "update",
            blob: { ciphertext: "c1" },
        });
        a.close();
        b.close();
    });

    it("catches a late device up on hello, then sends live", async () => {
        const { mint, open } = await start();
        const a = open(await mint());
        await opened(a);
        const ack = nextMsg(a);
        a.send(
            JSON.stringify({
                t: "push",
                ref: 1,
                blob: { nonce: "n", ciphertext: "stored" },
            }),
        );
        await ack;

        const late = open(await mint());
        await opened(late);
        const stream = untilLive(late);
        late.send(JSON.stringify({ t: "hello", lastSeq: 0 }));
        const msgs = await stream;

        expect(
            msgs.some(
                (m) => m.t === "update" && m.blob?.ciphertext === "stored",
            ),
        ).toBe(true);
        expect(msgs.at(-1)?.t).toBe("live");
        a.close();
        late.close();
    });

    it("closes an unauthorized socket", async () => {
        const { open } = await start();
        const ws = open("bogus-token");
        const code = await new Promise<number>((resolve) =>
            ws.on("close", (c) => resolve(c)),
        );
        expect(code).toBe(1008);
    });
});
