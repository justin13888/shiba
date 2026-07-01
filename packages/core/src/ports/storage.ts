import type { Id, Millis } from "../model/common";

export interface PersistedDoc {
    /** Latest compacted baseline, if any. */
    snapshot?: Uint8Array;
    /** Incremental updates appended since the baseline. */
    updates: Uint8Array[];
}

/**
 * Local, plaintext persistence of the CRDT document as a snapshot + an
 * append-only update log. (The local device is trusted; only the sync server
 * sees ciphertext — see `ports/crypto`.) Periodic {@link DocStore.compact}
 * collapses the log to bound load time.
 */
export interface DocStore {
    load(docId: string): Promise<PersistedDoc>;
    appendUpdate(docId: string, update: Uint8Array): Promise<void>;
    compact(docId: string, snapshot: Uint8Array): Promise<void>;
}

export interface SnapshotMeta {
    id: Id;
    createdAt: Millis;
    deviceId: string;
    /** Retention-policy ids that caused this snapshot. */
    triggers: string[];
    tabCount: number;
    groupCount: number;
    /**
     * Content hash of {@link Snapshot.state}, for change-detection (skip a capture
     * when nothing changed). Optional so snapshots from before this field remain
     * valid — a missing hash simply reads as "changed".
     */
    stateHash?: string;
}

/** An immutable point-in-time export of the document, kept out of the live doc. */
export interface Snapshot extends SnapshotMeta {
    state: Uint8Array;
}

export interface SnapshotStore {
    put(snapshot: Snapshot): Promise<void>;
    get(id: Id): Promise<Snapshot | undefined>;
    /** Newest-first metadata only (the blobs can be large). */
    list(): Promise<SnapshotMeta[]>;
    delete(id: Id): Promise<void>;
}
