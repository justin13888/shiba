import type { DataKey, KdfParams, KeyEnvelope } from "@shiba/core";
import { webCryptoEngine } from "@shiba/crypto-webcrypto";
import { fromBase64, toBase64 } from "@shiba/sync-protocol";
import { browser } from "wxt/browser";

export interface SyncConfig {
    serverUrl: string;
    token: string;
}

/** The device's saved server pairing, if any (device-local). */
export async function readSyncConfig(): Promise<SyncConfig | null> {
    const { syncConfig } = await browser.storage.local.get("syncConfig");
    return syncConfig && typeof syncConfig === "object"
        ? (syncConfig as SyncConfig)
        : null;
}

/** The unlocked data key (hex), held only in memory-backed session storage. */
export async function readDek(): Promise<string | null> {
    const { dek } = await browser.storage.session.get("dek");
    return typeof dek === "string" ? dek : null;
}

/** Whether the device is configured and unlocked for sync this session. */
export async function isSyncReady(): Promise<boolean> {
    return (await readSyncConfig()) !== null && (await readDek()) !== null;
}

interface SetupInput {
    serverUrl: string;
    serverSecret: string;
    passphrase: string;
}

/**
 * Pair this device with a sync server and unlock encryption. Mints a device
 * token, then either opens the existing key envelope with the passphrase or
 * creates one on first use. Caches the data key in (memory-only) session
 * storage; the background worker's sync manager reacts to that write and
 * (re)starts the engine — no reload required.
 */
export async function setupSync(input: SetupInput): Promise<void> {
    const base = input.serverUrl.replace(/\/$/, "");
    const devices = await fetch(`${base}/devices`, {
        method: "POST",
        headers: { authorization: `Bearer ${input.serverSecret}` },
    });
    if (!devices.ok) {
        throw new Error(
            "Could not register device — check the URL and secret.",
        );
    }
    const { token } = (await devices.json()) as { token: string };

    const existing = await fetch(`${base}/keys`, {
        headers: { authorization: `Bearer ${token}` },
    });
    let key: DataKey;
    if (existing.ok) {
        const km = (await existing.json()) as {
            salt: string;
            params: string | KdfParams;
            wrappedDek: string;
        };
        const envelope: KeyEnvelope = {
            salt: fromBase64(km.salt),
            kdf:
                typeof km.params === "string"
                    ? JSON.parse(km.params)
                    : km.params,
            wrappedDek: fromBase64(km.wrappedDek),
        };
        key = await webCryptoEngine.openEnvelope(input.passphrase, envelope);
    } else {
        const created = await webCryptoEngine.createEnvelope(input.passphrase);
        const put = await fetch(`${base}/keys`, {
            method: "PUT",
            headers: {
                authorization: `Bearer ${token}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                salt: toBase64(created.envelope.salt),
                params: created.envelope.kdf,
                wrappedDek: toBase64(created.envelope.wrappedDek),
            }),
        });
        if (!put.ok) throw new Error("Could not store key material.");
        key = created.key;
    }

    await browser.storage.local.set({ syncConfig: { serverUrl: base, token } });
    await browser.storage.session.set({
        dek: await webCryptoEngine.exportRecoveryKey(key),
    });
}

export async function disconnectSync(): Promise<void> {
    await browser.storage.local.remove("syncConfig");
    await browser.storage.session.remove("dek");
}
