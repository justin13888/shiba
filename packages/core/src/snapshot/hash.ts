/**
 * A fast, non-cryptographic content hash used only to tell whether the document
 * changed since the last snapshot — never for security. Two FNV-1a passes with
 * different seeds give a 64-bit hex digest; pure and deterministic (no BigInt, so
 * it runs anywhere `core` does). A collision at worst skips one hourly capture.
 */
function fnv1a(bytes: Uint8Array, seed: number): number {
    let h = seed | 0;
    for (let i = 0; i < bytes.length; i++) {
        h = Math.imul(h ^ (bytes[i] as number), 0x01000193);
    }
    return h >>> 0;
}

export function hashBytes(bytes: Uint8Array): string {
    const lo = fnv1a(bytes, 0x811c9dc5);
    const hi = fnv1a(bytes, 0x9e3779b1);
    return lo.toString(16).padStart(8, "0") + hi.toString(16).padStart(8, "0");
}
