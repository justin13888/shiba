import * as v from "valibot";

/**
 * @shiba/sync-protocol — the wire contract between the extension's sync engine
 * and the server. The server is a blind relay: every document payload is an
 * opaque {@link EncryptedBlob}, never plaintext.
 */
export const SYNC_PROTOCOL_VERSION = 1;

// btoa/atob are globals in browsers and Node 16+; declared here to avoid pulling
// in the DOM lib for this otherwise-pure package.
declare const btoa: (data: string) => string;
declare const atob: (data: string) => string;

export function toBase64(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

export function fromBase64(text: string): Uint8Array {
    const binary = atob(text);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
}

/** An AEAD ciphertext encoded for JSON transport. */
export interface EncryptedBlob {
    nonce: string;
    ciphertext: string;
}

const BlobSchema = v.object({ nonce: v.string(), ciphertext: v.string() });

export const ClientMessageSchema = v.variant("t", [
    v.object({ t: v.literal("hello"), lastSeq: v.number() }),
    v.object({ t: v.literal("push"), ref: v.number(), blob: BlobSchema }),
    v.object({ t: v.literal("ping") }),
]);
export type ClientMessage = v.InferOutput<typeof ClientMessageSchema>;

export const ServerMessageSchema = v.variant("t", [
    v.object({ t: v.literal("update"), seq: v.number(), blob: BlobSchema }),
    v.object({ t: v.literal("ack"), ref: v.number(), seq: v.number() }),
    v.object({ t: v.literal("live") }),
    v.object({ t: v.literal("compactSuggested"), count: v.number() }),
    v.object({ t: v.literal("pong") }),
]);
export type ServerMessage = v.InferOutput<typeof ServerMessageSchema>;

export const parseClientMessage = (raw: string): ClientMessage =>
    v.parse(ClientMessageSchema, JSON.parse(raw));
export const parseServerMessage = (raw: string): ServerMessage =>
    v.parse(ServerMessageSchema, JSON.parse(raw));
