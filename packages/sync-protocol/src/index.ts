/**
 * @shiba/sync-protocol — the wire contract shared by the extension's sync
 * engine and the sync server. Pure types + validators only; no transport.
 *
 * Filled in Phase 5. The server is a blind relay of opaque encrypted blobs, so
 * messages carry ciphertext + nonce, never plaintext document data.
 */
export const SYNC_PROTOCOL_VERSION = 1;
