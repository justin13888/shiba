import type { FracIndex, Id, Millis } from "../model";
import { byOrder, keyBetween } from "../ordering/fractional-index";
import type { RecordMap } from "../ports/crdt";
import type { Position } from "./ops";

interface Orderable {
    id: Id;
    order: FracIndex;
    deletedAt: Millis | null;
}

/** Snapshot a record map's values (may include holes if ids race). */
export function recordsOf<T extends { id: Id }>(
    map: RecordMap<T>,
): (T | undefined)[] {
    return map.ids().map((id) => map.get(id));
}

/** Live (non-deleted) records matching `inContainer`, sorted by `(order, id)`. */
export function collectLive<T extends Orderable>(
    values: Iterable<T | undefined>,
    inContainer: (record: T) => boolean,
): T[] {
    const out: T[] = [];
    for (const record of values) {
        if (record && record.deletedAt === null && inContainer(record)) {
            out.push(record);
        }
    }
    return out.sort(byOrder);
}

/**
 * Resolve a {@link Position} into a fractional-index key among `siblings`
 * (which must be sorted and must exclude the item being placed). Falls back to
 * appending at the end.
 */
export function placeAmong(
    siblings: ReadonlyArray<{ id: Id; order: FracIndex }>,
    position: Position = {},
): FracIndex {
    if (position.before != null) {
        const idx = siblings.findIndex((s) => s.id === position.before);
        if (idx >= 0) {
            const prev = siblings[idx - 1];
            const at = siblings[idx];
            return keyBetween(prev?.order ?? null, at?.order ?? null);
        }
    }
    if (position.after != null) {
        const idx = siblings.findIndex((s) => s.id === position.after);
        if (idx >= 0) {
            const at = siblings[idx];
            const next = siblings[idx + 1];
            return keyBetween(at?.order ?? null, next?.order ?? null);
        }
    }
    const last = siblings.at(-1);
    return keyBetween(last?.order ?? null, null);
}
