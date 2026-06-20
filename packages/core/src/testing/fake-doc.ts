import { CORE_SCHEMA_VERSION } from "../constants";
import { notImplemented } from "../internal/errors";
import type { DocCollection, DocSnapshot, Id } from "../model";
import type {
    CrdtDocument,
    DocChange,
    DocMeta,
    DocTx,
    MetaMap,
    RecordMap,
} from "../ports/crdt";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

class MapRecordMap<T extends { id: Id }> implements RecordMap<T> {
    constructor(
        private readonly map: Map<Id, T>,
        private readonly touch: () => void,
    ) {}
    get(id: Id): T | undefined {
        const v = this.map.get(id);
        return v ? clone(v) : undefined;
    }
    has(id: Id): boolean {
        return this.map.has(id);
    }
    set(id: Id, value: T): void {
        this.map.set(id, clone(value));
        this.touch();
    }
    patch(id: Id, partial: Partial<T>): void {
        const cur = this.map.get(id);
        if (cur) {
            this.map.set(id, { ...cur, ...clone(partial) });
            this.touch();
        }
    }
    delete(id: Id): void {
        if (this.map.delete(id)) this.touch();
    }
    ids(): Id[] {
        return [...this.map.keys()];
    }
}

const toRecord = <T>(map: Map<Id, T>): Readonly<Record<Id, T>> => {
    const out: Record<Id, T> = {};
    for (const [id, v] of map) out[id] = clone(v);
    return out;
};

/**
 * An in-memory {@link CrdtDocument} backed by plain Maps. It exercises the same
 * port the Yjs adapter implements, so `doc/ops`, `doc/queries`, and
 * `doc/reconcile` are tested headlessly. (Encoding/delta sync are exclusive to
 * the real CRDT and intentionally unsupported here.)
 */
export function createFakeDoc(deviceId = "test-device"): CrdtDocument {
    const maps = {
        workspaces: new Map(),
        folders: new Map(),
        groups: new Map(),
        tabs: new Map(),
        tags: new Map(),
    } as const;
    const meta: DocMeta = { schemaVersion: CORE_SCHEMA_VERSION, deviceId };
    const listeners = new Set<(change: DocChange) => void>();

    const metaMap: MetaMap = {
        get: (k) => meta[k],
        set: (k, v) => {
            meta[k] = v;
        },
    };

    return {
        mutate(fn: (tx: DocTx) => void) {
            const changed = new Set<DocCollection>();
            const mk = <T extends { id: Id }>(
                c: DocCollection,
                m: Map<Id, T>,
            ) => new MapRecordMap(m, () => changed.add(c));
            fn({
                workspaces: mk("workspaces", maps.workspaces),
                folders: mk("folders", maps.folders),
                groups: mk("groups", maps.groups),
                tabs: mk("tabs", maps.tabs),
                tags: mk("tags", maps.tags),
                meta: metaMap,
            });
            if (changed.size > 0) {
                const change: DocChange = { origin: "local", changed };
                for (const l of listeners) l(change);
            }
            return new Uint8Array();
        },
        snapshot(): DocSnapshot {
            return {
                schemaVersion: meta.schemaVersion,
                workspaces: toRecord(maps.workspaces),
                folders: toRecord(maps.folders),
                groups: toRecord(maps.groups),
                tabs: toRecord(maps.tabs),
                tags: toRecord(maps.tags),
            };
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        destroy() {
            listeners.clear();
        },
        applyUpdate: () => notImplemented("fakeDoc.applyUpdate"),
        encodeState: () => notImplemented("fakeDoc.encodeState"),
        stateVector: () => notImplemented("fakeDoc.stateVector"),
        encodeStateSince: () => notImplemented("fakeDoc.encodeStateSince"),
    };
}
