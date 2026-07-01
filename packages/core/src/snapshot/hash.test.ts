import { describe, expect, it } from "vitest";
import { hashBytes } from "./hash";

describe("hashBytes", () => {
    it("is deterministic for identical content", () => {
        expect(hashBytes(new Uint8Array([1, 2, 3, 4]))).toBe(
            hashBytes(new Uint8Array([1, 2, 3, 4])),
        );
    });

    it("differs for different content", () => {
        expect(hashBytes(new Uint8Array([1, 2, 3]))).not.toBe(
            hashBytes(new Uint8Array([1, 2, 4])),
        );
    });

    it("produces a 16-char hex digest", () => {
        expect(hashBytes(new Uint8Array([9, 8, 7]))).toMatch(/^[0-9a-f]{16}$/);
    });

    it("distinguishes empty from a zero byte", () => {
        expect(hashBytes(new Uint8Array())).not.toBe(
            hashBytes(new Uint8Array([0])),
        );
    });
});
