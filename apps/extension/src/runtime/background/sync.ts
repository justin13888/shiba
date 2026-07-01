import {
    type CrdtDocument,
    createSyncEngine,
    type SyncEngine,
} from "@shiba/core";
import { webCryptoEngine } from "@shiba/crypto-webcrypto";
import { browser } from "wxt/browser";
import { createWsTransport } from "@/src/adapters/transport";
import { readDek, readSyncConfig } from "../sync";
import { DOC_ID } from "./runtime";

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

    async function restart(): Promise<void> {
        engine?.stop();
        engine = null;
        const config = await readSyncConfig();
        const dek = await readDek();
        if (!config || !dek) return;
        const key = await webCryptoEngine.importRecoveryKey(dek);
        const next = createSyncEngine({
            doc,
            transport: createWsTransport(config.serverUrl),
            crypto: webCryptoEngine,
            key,
            token: config.token,
            docId: DOC_ID,
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
    };
}
