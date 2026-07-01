import {
    type ConnectionStatus,
    type CrdtDocument,
    createSyncEngine,
    type SyncEngine,
} from "@shiba/core";
import { webCryptoEngine } from "@shiba/crypto-webcrypto";
import { browser } from "wxt/browser";
import { createWsTransport } from "@/src/adapters/transport";
import { readDek, readSyncConfig, type SyncStatus } from "../sync";
import { DOC_ID } from "./runtime";

// The worker owns the single sync engine, so it also owns the one true
// connection status. The Options page reads this via the `getSyncStatus` RPC.
let current: SyncStatus = { status: "offline", lastOnlineAt: null };

/** Latest sync connection status tracked by the worker's engine. */
export function getSyncStatus(): SyncStatus {
    return current;
}

/**
 * Run the encrypted sync engine from the worker (not the page), so the single
 * owned document is what syncs and the socket outlives any UI tab. The engine is
 * (re)started whenever the device pairing or unlocked key changes — pairing from
 * the Options page writes `storage`, and this manager reacts — so connecting no
 * longer needs a reload. Returns a cleanup that detaches the listener and stops
 * the engine.
 */
export function manageSync(doc: CrdtDocument): () => void {
    let engine: SyncEngine | null = null;

    const setStatus = (status: ConnectionStatus): void => {
        current = {
            status,
            lastOnlineAt:
                status === "online" ? Date.now() : current.lastOnlineAt,
        };
    };

    async function restart(): Promise<void> {
        engine?.stop();
        engine = null;
        const config = await readSyncConfig();
        const dek = await readDek();
        if (!config || !dek) {
            // Unpaired (or locked): no engine, no history to report.
            current = { status: "offline", lastOnlineAt: null };
            return;
        }
        const key = await webCryptoEngine.importRecoveryKey(dek);
        const next = createSyncEngine({
            doc,
            transport: createWsTransport(config.serverUrl),
            crypto: webCryptoEngine,
            key,
            token: config.token,
            docId: DOC_ID,
            onStatus: setStatus,
        });
        await next.start();
        engine = next;
    }

    const onChange = (changes: Record<string, unknown>, area: string): void => {
        if (
            (area === "local" && changes.syncConfig) ||
            (area === "session" && changes.dek)
        ) {
            void restart();
        }
    };
    browser.storage.onChanged.addListener(onChange);
    void restart();

    return () => {
        browser.storage.onChanged.removeListener(onChange);
        engine?.stop();
        current = { status: "offline", lastOnlineAt: null };
    };
}
