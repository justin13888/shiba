/// <reference lib="dom" />
import type { CryptoEngine, DataKey, KdfParams, Sealed } from "@shiba/core";
import { argon2id } from "hash-wasm";

/** OWASP-aligned Argon2id defaults (19 MiB, t=2, p=1). */
export const DEFAULT_KDF: KdfParams = {
    algorithm: "argon2id",
    memoryKiB: 19456,
    iterations: 2,
    parallelism: 1,
};

const NONCE_BYTES = 12;
const KEY_BYTES = 32;
const SALT_BYTES = 16;

class Dek implements DataKey {
    readonly __brand = "DataKey";
    constructor(
        readonly raw: Uint8Array,
        readonly key: CryptoKey,
    ) {}
}

// WebCrypto wants ArrayBuffer-backed views; copy to satisfy TS 5.7's stricter
// BufferSource typing (our byte arrays are generic Uint8Array<ArrayBufferLike>).
const ab = (b: Uint8Array): Uint8Array<ArrayBuffer> => new Uint8Array(b);

const importAesKey = (raw: Uint8Array): Promise<CryptoKey> =>
    crypto.subtle.importKey("raw", ab(raw), "AES-GCM", false, [
        "encrypt",
        "decrypt",
    ]);

async function deriveKek(
    passphrase: string,
    salt: Uint8Array,
    kdf: KdfParams,
): Promise<CryptoKey> {
    const raw = (await argon2id({
        password: passphrase,
        salt,
        parallelism: kdf.parallelism,
        iterations: kdf.iterations,
        memorySize: kdf.memoryKiB,
        hashLength: KEY_BYTES,
        outputType: "binary",
    })) as Uint8Array;
    return importAesKey(raw);
}

async function aesEncrypt(
    key: CryptoKey,
    plaintext: Uint8Array,
    aad?: Uint8Array,
): Promise<Sealed> {
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
    const params: AesGcmParams = { name: "AES-GCM", iv: nonce };
    if (aad) params.additionalData = ab(aad);
    const ct = await crypto.subtle.encrypt(params, key, ab(plaintext));
    return { nonce, ciphertext: new Uint8Array(ct) };
}

async function aesDecrypt(
    key: CryptoKey,
    sealed: Sealed,
    aad?: Uint8Array,
): Promise<Uint8Array> {
    const params: AesGcmParams = { name: "AES-GCM", iv: ab(sealed.nonce) };
    if (aad) params.additionalData = ab(aad);
    const pt = await crypto.subtle.decrypt(params, key, ab(sealed.ciphertext));
    return new Uint8Array(pt);
}

const pack = (s: Sealed): Uint8Array => {
    const out = new Uint8Array(s.nonce.length + s.ciphertext.length);
    out.set(s.nonce);
    out.set(s.ciphertext, s.nonce.length);
    return out;
};
const unpack = (b: Uint8Array): Sealed => ({
    nonce: b.slice(0, NONCE_BYTES),
    ciphertext: b.slice(NONCE_BYTES),
});

const toHex = (bytes: Uint8Array): string =>
    Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string): Uint8Array => {
    const clean = hex.trim().toLowerCase();
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
};

/** Construct an engine; pass lighter `kdf` params in tests for speed. */
export function createWebCryptoEngine(
    kdf: KdfParams = DEFAULT_KDF,
): CryptoEngine {
    return {
        async createEnvelope(passphrase) {
            const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
            const kek = await deriveKek(passphrase, salt, kdf);
            const raw = crypto.getRandomValues(new Uint8Array(KEY_BYTES));
            const wrappedDek = pack(await aesEncrypt(kek, raw));
            return {
                envelope: { salt, kdf, wrappedDek },
                key: new Dek(raw, await importAesKey(raw)),
            };
        },
        async openEnvelope(passphrase, envelope) {
            const kek = await deriveKek(
                passphrase,
                envelope.salt,
                envelope.kdf,
            );
            const raw = await aesDecrypt(kek, unpack(envelope.wrappedDek));
            return new Dek(raw, await importAesKey(raw));
        },
        async rewrapEnvelope(key, newPassphrase) {
            const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
            const kek = await deriveKek(newPassphrase, salt, kdf);
            const wrappedDek = pack(await aesEncrypt(kek, (key as Dek).raw));
            return { salt, kdf, wrappedDek };
        },
        exportRecoveryKey: (key) => Promise.resolve(toHex((key as Dek).raw)),
        async importRecoveryKey(recoveryKey) {
            const raw = fromHex(recoveryKey);
            return new Dek(raw, await importAesKey(raw));
        },
        seal: (key, plaintext, aad) =>
            aesEncrypt((key as Dek).key, plaintext, aad),
        open: (key, sealed, aad) => aesDecrypt((key as Dek).key, sealed, aad),
    } satisfies CryptoEngine;
}

/** Default engine using {@link DEFAULT_KDF}. */
export const webCryptoEngine: CryptoEngine = createWebCryptoEngine();
