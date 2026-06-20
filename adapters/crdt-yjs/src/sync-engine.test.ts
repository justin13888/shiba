import {
    type ConnectionStatus,
    type CrdtDocument,
    createSyncEngine,
    type DocSnapshot,
    ops,
    type SyncTransport,
} from "@shiba/core";
import { seqIdGen, testDeps } from "@shiba/core/testing";
import { createWebCryptoEngine } from "@shiba/crypto-webcrypto";
import type {
    ClientMessage,
    EncryptedBlob,
    ServerMessage,
} from "@shiba/sync-protocol";
import { describe, expect, it } from "vitest";
import { yjsAdapter } from "./index";

/** A blind in-memory relay: stores opaque blobs, assigns seqs, fans out. */
class Hub {
    readonly log: { seq: number; blob: EncryptedBlob }[] = [];
    private readonly clients = new Set<Loopback>();
    add(c: Loopback): void {
        this.clients.add(c);
    }
    remove(c: Loopback): void {
        this.clients.delete(c);
    }
    hello(to: Loopback, lastSeq: number): void {
        for (const e of this.log) {
            if (e.seq > lastSeq)
                to.deliver({ t: "update", seq: e.seq, blob: e.blob });
        }
        to.deliver({ t: "live" });
    }
    push(from: Loopback, ref: number, blob: EncryptedBlob): void {
        const seq = this.log.length + 1;
        this.log.push({ seq, blob });
        from.deliver({ t: "ack", ref, seq });
        for (const c of this.clients) {
            if (c !== from) c.deliver({ t: "update", seq, blob });
        }
    }
}

class Loopback implements SyncTransport {
    private readonly onMsg = new Set<(m: ServerMessage) => void>();
    private readonly onStat = new Set<(s: ConnectionStatus) => void>();
    constructor(private readonly hub: Hub) {}
    connect(): Promise<void> {
        this.hub.add(this);
        for (const h of this.onStat) h("online");
        return Promise.resolve();
    }
    disconnect(): void {
        this.hub.remove(this);
    }
    send(message: ClientMessage): void {
        if (message.t === "hello") this.hub.hello(this, message.lastSeq);
        else if (message.t === "push")
            this.hub.push(this, message.ref, message.blob);
    }
    onMessage(handler: (m: ServerMessage) => void) {
        this.onMsg.add(handler);
        return () => this.onMsg.delete(handler);
    }
    onStatus(handler: (s: ConnectionStatus) => void) {
        this.onStat.add(handler);
        return () => this.onStat.delete(handler);
    }
    deliver(message: ServerMessage): void {
        for (const h of this.onMsg) h(message);
    }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
const cryptoEngine = createWebCryptoEngine({
    algorithm: "argon2id",
    memoryKiB: 256,
    iterations: 1,
    parallelism: 1,
});

function canon(doc: CrdtDocument): DocSnapshot {
    const s = doc.snapshot();
    const tabs = Object.fromEntries(
        Object.entries(s.tabs).map(([id, t]) => [
            id,
            { ...t, tagIds: [...t.tagIds].sort() },
        ]),
    );
    return { ...s, tabs };
}

describe("sync engine (encrypted, over a blind relay)", () => {
    it("converges two devices and never exposes plaintext to the relay", async () => {
        const { key } = await cryptoEngine.createEnvelope("passphrase");
        const hub = new Hub();
        const depsA = testDeps({ ids: seqIdGen("a") });
        const depsB = testDeps({ ids: seqIdGen("b") });

        const docA = yjsAdapter.create("A");
        let groupId = "";
        docA.mutate((tx) => {
            const ws = ops.createWorkspace(tx, depsA, { name: "W" });
            groupId = ops.createGroup(tx, depsA, { workspaceId: ws.id }).id;
        });
        const docB = yjsAdapter.create("B");

        const engineA = createSyncEngine({
            doc: docA,
            transport: new Loopback(hub),
            crypto: cryptoEngine,
            key,
            token: "t",
        });
        const engineB = createSyncEngine({
            doc: docB,
            transport: new Loopback(hub),
            crypto: cryptoEngine,
            key,
            token: "t",
        });
        await engineA.start();
        await engineB.start();
        await settle();

        // Edit on each device concurrently.
        docA.mutate((tx) =>
            ops.createTab(tx, depsA, {
                groupId,
                url: "https://secret-alpha.example",
                title: "Alpha",
            }),
        );
        docB.mutate((tx) =>
            ops.createTab(tx, depsB, {
                groupId,
                url: "https://secret-beta.example",
                title: "Beta",
            }),
        );
        await settle();
        await settle();

        expect(canon(docA)).toEqual(canon(docB));
        expect(Object.keys(docA.snapshot().tabs)).toHaveLength(2);

        // The relay only ever held ciphertext.
        const wire = JSON.stringify(hub.log);
        expect(wire).not.toContain("secret-alpha");
        expect(wire).not.toContain("Alpha");

        engineA.stop();
        engineB.stop();
    });
});
