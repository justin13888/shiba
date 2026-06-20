import { describe, expect, it } from "vitest";
import { byOrder, keyBetween, keysBetween } from "./fractional-index";

describe("fractional-index", () => {
    it("appended keys stay strictly ascending and unique", () => {
        let prev: string | null = null;
        const keys: string[] = [];
        for (let i = 0; i < 50; i++) {
            const k = keyBetween(prev, null);
            keys.push(k);
            prev = k;
        }
        expect([...keys].sort()).toEqual(keys);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("produces a key strictly between two neighbours", () => {
        const a = keyBetween(null, null);
        const c = keyBetween(a, null);
        const b = keyBetween(a, c);
        expect(a < b && b < c).toBe(true);
    });

    it("survives repeated midpoint insertion", () => {
        const lo = keyBetween(null, null);
        let hi = keyBetween(lo, null);
        for (let i = 0; i < 30; i++) {
            const mid = keyBetween(lo, hi);
            expect(lo < mid && mid < hi).toBe(true);
            hi = mid;
        }
    });

    it("keysBetween returns n ascending keys", () => {
        const keys = keysBetween(null, null, 5);
        expect(keys).toHaveLength(5);
        expect([...keys].sort()).toEqual(keys);
    });

    it("byOrder breaks ties deterministically by id", () => {
        expect(
            byOrder({ order: "a", id: "1" }, { order: "a", id: "2" }),
        ).toBeLessThan(0);
        expect(
            byOrder({ order: "b", id: "1" }, { order: "a", id: "9" }),
        ).toBeGreaterThan(0);
        expect(byOrder({ order: "a", id: "1" }, { order: "a", id: "1" })).toBe(
            0,
        );
    });
});
