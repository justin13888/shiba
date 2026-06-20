import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import type { FracIndex, Id } from "../model/common";

/**
 * Fractional indexing turns "reorder" and "move to another container" into a
 * single conflict-free field write: pick a key strictly between the neighbours.
 * Records are sorted by `(order, id)` so two offline devices that pick the same
 * key never visually flip — `id` is the deterministic tiebreaker.
 */

/** A key strictly between `a` and `b`; pass `null` for an open end. */
export function keyBetween(
    a: FracIndex | null,
    b: FracIndex | null,
): FracIndex {
    return generateKeyBetween(a, b);
}

/** `n` evenly spaced keys strictly between `a` and `b`. */
export function keysBetween(
    a: FracIndex | null,
    b: FracIndex | null,
    n: number,
): FracIndex[] {
    return generateNKeysBetween(a, b, n);
}

/** Stable comparator: by `order`, then `id` as a deterministic tiebreaker. */
export function byOrder(
    a: { order: FracIndex; id: Id },
    b: { order: FracIndex; id: Id },
): number {
    if (a.order !== b.order) return a.order < b.order ? -1 : 1;
    if (a.id !== b.id) return a.id < b.id ? -1 : 1;
    return 0;
}
