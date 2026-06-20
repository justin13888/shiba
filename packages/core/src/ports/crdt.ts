import type {
    DocCollection,
    DocSnapshot,
    Folder,
    Group,
    Id,
    Tab,
    Tag,
    Workspace,
} from "../model";

export type Unsubscribe = () => void;

/** A CRDT map of records keyed by id. Field-level merge is the adapter's job. */
export interface RecordMap<T> {
    get(id: Id): T | undefined;
    has(id: Id): boolean;
    /** Create or replace a whole record. */
    set(id: Id, value: T): void;
    /** Merge a partial update into an existing record (field-level). */
    patch(id: Id, partial: Partial<T>): void;
    /** Hard-delete a record. Prefer soft delete (set `deletedAt`) in app logic. */
    delete(id: Id): void;
    ids(): Id[];
}

/** Document-level metadata stored in the CRDT `meta` map. */
export interface DocMeta {
    schemaVersion: number;
    deviceId: string;
}

export interface MetaMap {
    get<K extends keyof DocMeta>(key: K): DocMeta[K] | undefined;
    set<K extends keyof DocMeta>(key: K, value: DocMeta[K]): void;
}

/** The mutable view of the document passed to a {@link CrdtDocument.mutate}. */
export interface DocTx {
    workspaces: RecordMap<Workspace>;
    folders: RecordMap<Folder>;
    groups: RecordMap<Group>;
    tabs: RecordMap<Tab>;
    tags: RecordMap<Tag>;
    meta: MetaMap;
}

export interface DocChange {
    origin: "local" | "remote";
    changed: ReadonlySet<DocCollection>;
}

/**
 * The document is itself behind a port so `core` never imports a CRDT library.
 * The concrete implementation (Yjs) lives in `adapters/crdt-yjs`.
 */
export interface CrdtDocument {
    /** Apply a mutation atomically; returns the encoded update for persist/sync. */
    mutate(fn: (tx: DocTx) => void): Uint8Array;
    /** Merge a persisted/remote update. Returns true if state changed. */
    applyUpdate(update: Uint8Array, origin?: "local" | "remote"): boolean;
    /** Full encoded state (for snapshots / first sync). */
    encodeState(): Uint8Array;
    /** State vector (frontier) for delta sync. */
    stateVector(): Uint8Array;
    /** Updates not yet seen by a peer at `stateVector`. */
    encodeStateSince(stateVector: Uint8Array): Uint8Array;
    /** Cheap plain read-model for selectors and the UI. */
    snapshot(): DocSnapshot;
    subscribe(listener: (change: DocChange) => void): Unsubscribe;
    destroy(): void;
}

/** Constructs documents; hides the concrete CRDT library. */
export interface CrdtAdapter {
    create(deviceId: string): CrdtDocument;
    load(deviceId: string, state: Uint8Array): CrdtDocument;
}
