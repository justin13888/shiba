import type { KdfParams } from "@shiba/core";
import { describe, expect, it } from "vitest";
import { createWebCryptoEngine } from "./index";

// Light KDF keeps the suite fast; production uses DEFAULT_KDF.
const FAST_KDF: KdfParams = {
    algorithm: "argon2id",
    memoryKiB: 256,
    iterations: 1,
    parallelism: 1,
};
const engine = createWebCryptoEngine(FAST_KDF);
const enc = new TextEncoder();
const dec = new TextDecoder();

describe("webCryptoEngine", () => {
    it("round-trips data through seal/open", async () => {
        const { key } = await engine.createEnvelope("pw");
        const sealed = await engine.seal(key, enc.encode("secret"));
        expect(dec.decode(await engine.open(key, sealed))).toBe("secret");
    });

    it("opens with the right passphrase and rejects a wrong one", async () => {
        const { envelope, key } = await engine.createEnvelope("correct horse");
        const reopened = await engine.openEnvelope("correct horse", envelope);
        const sealed = await engine.seal(key, enc.encode("x"));
        expect(dec.decode(await engine.open(reopened, sealed))).toBe("x");
        await expect(engine.openEnvelope("wrong", envelope)).rejects.toThrow();
    });

    it("detects tampering via the GCM tag", async () => {
        const { key } = await engine.createEnvelope("pw");
        const sealed = await engine.seal(key, enc.encode("data"));
        sealed.ciphertext[0] = (sealed.ciphertext[0] ?? 0) ^ 0xff;
        await expect(engine.open(key, sealed)).rejects.toThrow();
    });

    it("binds AAD to the ciphertext", async () => {
        const { key } = await engine.createEnvelope("pw");
        const sealed = await engine.seal(
            key,
            enc.encode("d"),
            enc.encode("doc|1"),
        );
        await expect(
            engine.open(key, sealed, enc.encode("doc|2")),
        ).rejects.toThrow();
        expect(
            (await engine.open(key, sealed, enc.encode("doc|1"))).length,
        ).toBe(1);
    });

    it("reconstructs the DEK from a recovery key", async () => {
        const { key } = await engine.createEnvelope("pw");
        const restored = await engine.importRecoveryKey(
            await engine.exportRecoveryKey(key),
        );
        const sealed = await engine.seal(key, enc.encode("z"));
        expect(dec.decode(await engine.open(restored, sealed))).toBe("z");
    });

    it("re-wraps the same DEK under a new passphrase", async () => {
        const { key } = await engine.createEnvelope("old");
        const env2 = await engine.rewrapEnvelope(key, "new");
        const reopened = await engine.openEnvelope("new", env2);
        expect(await engine.exportRecoveryKey(reopened)).toBe(
            await engine.exportRecoveryKey(key),
        );
    });
});
