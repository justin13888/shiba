/** Argon2id parameters recorded alongside the salt so any device can re-derive. */
export interface KdfParams {
    algorithm: "argon2id";
    memoryKiB: number;
    iterations: number;
    parallelism: number;
}

/** Passphrase-protected key material; safe to store on the server. */
export interface KeyEnvelope {
    salt: Uint8Array;
    kdf: KdfParams;
    /** AES-GCM(KEK, DEK) including its nonce. */
    wrappedDek: Uint8Array;
}

/** An AEAD ciphertext: random nonce + ciphertext-with-tag. */
export interface Sealed {
    nonce: Uint8Array;
    ciphertext: Uint8Array;
}

/** Opaque handle to an in-memory data-encryption key; never serialized raw. */
export interface DataKey {
    readonly __brand: "DataKey";
}

/**
 * End-to-end encryption via an envelope: a random 256-bit DEK encrypts all
 * synced data; the DEK is wrapped by a KEK derived from the passphrase
 * (Argon2id). The server only ever sees ciphertext. Implemented with WebCrypto
 * in `adapters/crypto-webcrypto`.
 */
export interface CryptoEngine {
    /** Generate a fresh DEK and wrap it under `passphrase`. */
    createEnvelope(
        passphrase: string,
    ): Promise<{ envelope: KeyEnvelope; key: DataKey }>;
    /** Recover the DEK from an envelope; rejects on a wrong passphrase. */
    openEnvelope(passphrase: string, envelope: KeyEnvelope): Promise<DataKey>;
    /** Re-wrap the existing DEK under a new passphrase (passphrase change). */
    rewrapEnvelope(key: DataKey, newPassphrase: string): Promise<KeyEnvelope>;
    /** Encode/decode the DEK as a human-writable recovery key. */
    exportRecoveryKey(key: DataKey): Promise<string>;
    importRecoveryKey(recoveryKey: string): Promise<DataKey>;
    /** AES-256-GCM seal/open, binding `aad` (e.g. `docId|seq`) into the tag. */
    seal(
        key: DataKey,
        plaintext: Uint8Array,
        aad?: Uint8Array,
    ): Promise<Sealed>;
    open(key: DataKey, sealed: Sealed, aad?: Uint8Array): Promise<Uint8Array>;
}
