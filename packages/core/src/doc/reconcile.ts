import { notImplemented } from "../internal/errors";
import type { DocTx } from "../ports/crdt";
import type { OpDeps } from "./ops";

export interface ReconcileOptions {
    /** Tombstones whose `deletedAt` is older than this (ms) are hard-purged. */
    tombstoneTtlMs?: number;
}

export interface ReconcileReport {
    /** Records permanently removed past the tombstone TTL. */
    purged: number;
    /** Orphans (dangling parent ref) re-parented into a recovery container. */
    reparented: number;
    /** Sibling sets whose duplicate order keys were regenerated. */
    orderRepaired: number;
    /** Folder parent cycles broken. */
    cyclesBroken: number;
}

/**
 * Self-healing pass over the document: hard-purge expired tombstones, re-parent
 * orphans, break folder cycles, and repair duplicate order keys left by a merge.
 * Convergent — runs on a single trigger (a background alarm) and syncs like any
 * other mutation. This replaces the missing referential integrity.
 */
export function reconcile(
    _tx: DocTx,
    _deps: OpDeps,
    _options?: ReconcileOptions,
): ReconcileReport {
    return notImplemented("reconcile");
}
