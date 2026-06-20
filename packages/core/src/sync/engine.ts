import {
    type EncryptedBlob,
    fromBase64,
    type ServerMessage,
    toBase64,
} from "@shiba/sync-protocol";
import type { CrdtDocument } from "../ports/crdt";
import type { CryptoEngine, DataKey } from "../ports/crypto";
import type { ConnectionStatus, SyncTransport } from "../ports/transport";

export interface SyncEngineOptions {
    doc: CrdtDocument;
    transport: SyncTransport;
    crypto: CryptoEngine;
    key: DataKey;
    token: string;
    onStatus?: (status: ConnectionStatus) => void;
}

export interface SyncEngine {
    start(): Promise<void>;
    stop(): void;
    status(): ConnectionStatus;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

/**
 * Offline-first sync over an encrypted, blind relay. Local edits are encrypted
 * and pushed as deltas; remote updates are decrypted and merged. On (re)connect
 * the engine pushes its full state so the server can never miss an offline edit;
 * re-applying a known update is a CRDT no-op, so the protocol is idempotent.
 */
export function createSyncEngine(options: SyncEngineOptions): SyncEngine {
    const { doc, transport, crypto, key } = options;
    let status: ConnectionStatus = "offline";
    let syncedVector = doc.stateVector();
    let ref = 0;
    const cleanups: Array<() => void> = [];

    const seal = async (bytes: Uint8Array): Promise<EncryptedBlob> => {
        const sealed = await crypto.seal(key, bytes);
        return {
            nonce: toBase64(sealed.nonce),
            ciphertext: toBase64(sealed.ciphertext),
        };
    };
    const open = (blob: EncryptedBlob): Promise<Uint8Array> =>
        crypto.open(key, {
            nonce: fromBase64(blob.nonce),
            ciphertext: fromBase64(blob.ciphertext),
        });

    async function pushDelta(): Promise<void> {
        if (
            status !== "online" ||
            bytesEqual(doc.stateVector(), syncedVector)
        ) {
            return;
        }
        const delta = doc.encodeStateSince(syncedVector);
        syncedVector = doc.stateVector();
        transport.send({ t: "push", ref: ++ref, blob: await seal(delta) });
    }

    async function onMessage(message: ServerMessage): Promise<void> {
        if (message.t === "update") {
            doc.applyUpdate(await open(message.blob), "remote");
            syncedVector = doc.stateVector(); // never echo a received update back
        } else if (message.t === "live") {
            // Catch-up complete: push full state so offline edits can't be lost.
            transport.send({
                t: "push",
                ref: ++ref,
                blob: await seal(doc.encodeState()),
            });
            syncedVector = doc.stateVector();
        }
    }

    function onStatusChange(next: ConnectionStatus): void {
        status = next;
        options.onStatus?.(next);
        if (next === "online") transport.send({ t: "hello", lastSeq: 0 });
    }

    return {
        async start() {
            cleanups.push(transport.onMessage((m) => void onMessage(m)));
            cleanups.push(transport.onStatus(onStatusChange));
            cleanups.push(
                doc.subscribe((change) => {
                    if (change.origin === "local") void pushDelta();
                }),
            );
            await transport.connect(options.token);
        },
        stop() {
            for (const cleanup of cleanups) cleanup();
            transport.disconnect();
            status = "offline";
        },
        status: () => status,
    };
}
