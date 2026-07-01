import { createNodeWebSocket } from "@hono/node-ws";
import { parseClientMessage } from "@shiba/sync-protocol";
import { gt } from "drizzle-orm";
import type { WSContext } from "hono/ws";
import { createApp, deviceForToken, touchDevice } from "./app";
import type { Db } from "./db";
import { logger } from "./logger";
import { docUpdates } from "./schema";

/**
 * Build the sync server: the HTTP app plus the blind `WS /sync` relay. Extracted
 * from the entrypoint so it can be served on an ephemeral port in tests. The
 * server never decrypts — it streams `doc_updates` on `hello`, assigns a `seq` +
 * `ack`s each `push`, and fans the (still-opaque) blob out to the account's other
 * sockets.
 */
export function createSyncServer(db: Db, secret: string | undefined) {
    const app = createApp(db, secret);
    const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
    const sockets = new Set<WSContext>();

    app.get(
        "/sync",
        upgradeWebSocket((c) => {
            const token = c.req.query("token");
            let deviceId: string | null = null;
            return {
                onOpen(_event, ws) {
                    deviceId = token ? deviceForToken(db, token) : null;
                    if (!deviceId || !token) {
                        ws.close(1008, "unauthorized");
                        return;
                    }
                    touchDevice(db, token);
                    sockets.add(ws);
                },
                onMessage(event, ws) {
                    if (!deviceId) return;
                    try {
                        const msg = parseClientMessage(String(event.data));
                        if (msg.t === "hello") {
                            const rows = db
                                .select()
                                .from(docUpdates)
                                .where(gt(docUpdates.seq, msg.lastSeq))
                                .all();
                            for (const row of rows) {
                                ws.send(
                                    JSON.stringify({
                                        t: "update",
                                        seq: row.seq,
                                        blob: {
                                            nonce: row.nonce,
                                            ciphertext: row.ciphertext,
                                        },
                                    }),
                                );
                            }
                            ws.send(JSON.stringify({ t: "live" }));
                        } else if (msg.t === "push") {
                            const result = db
                                .insert(docUpdates)
                                .values({
                                    deviceId,
                                    nonce: msg.blob.nonce,
                                    ciphertext: msg.blob.ciphertext,
                                    createdAt: Date.now(),
                                })
                                .run();
                            const seq = Number(result.lastInsertRowid);
                            ws.send(
                                JSON.stringify({ t: "ack", ref: msg.ref, seq }),
                            );
                            const broadcast = JSON.stringify({
                                t: "update",
                                seq,
                                blob: msg.blob,
                            });
                            for (const peer of sockets) {
                                if (peer !== ws) peer.send(broadcast);
                            }
                        } else if (msg.t === "ping") {
                            ws.send(JSON.stringify({ t: "pong" }));
                        }
                    } catch (error) {
                        logger.warn(
                            { error },
                            "dropping malformed sync message",
                        );
                    }
                },
                onClose(_event, ws) {
                    sockets.delete(ws);
                },
            };
        }),
    );

    return { app, injectWebSocket };
}
