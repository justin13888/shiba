import {
    CORE_SCHEMA_VERSION,
    type CrdtAdapter,
    type CrdtDocument,
    DOC_COLLECTIONS,
    type DocChange,
    type DocCollection,
    type DocMeta,
    type DocSnapshot,
    type DocTx,
    type Id,
    type MetaMap,
    type RecordMap,
    type Unsubscribe,
} from "@shiba/core";
import * as Y from "yjs";

/** Transaction origin marking a local mutation (vs. an applied remote update). */
const LOCAL: unique symbol = Symbol("shiba-local");

type AnyRecord = Record<string, unknown>;

function recordToYMap(record: AnyRecord): Y.Map<unknown> {
    const ymap = new Y.Map<unknown>();
    for (const [key, value] of Object.entries(record)) {
        if (value === undefined) continue;
        if (key === "tagIds" && Array.isArray(value)) {
            const set = new Y.Map<boolean>();
            for (const id of value) set.set(id as string, true);
            ymap.set(key, set);
        } else {
            ymap.set(key, value);
        }
    }
    return ymap;
}

function yMapToRecord(ymap: Y.Map<unknown>): AnyRecord {
    const out: AnyRecord = {};
    ymap.forEach((value, key) => {
        out[key] = value instanceof Y.Map ? [...value.keys()] : value;
    });
    return out;
}

class YRecordMap<T extends { id: Id }> implements RecordMap<T> {
    constructor(private readonly map: Y.Map<Y.Map<unknown>>) {}

    get(id: Id): T | undefined {
        const ymap = this.map.get(id);
        return ymap ? (yMapToRecord(ymap) as T) : undefined;
    }
    has(id: Id): boolean {
        return this.map.has(id);
    }
    set(id: Id, value: T): void {
        this.map.set(id, recordToYMap(value as AnyRecord));
    }
    patch(id: Id, partial: Partial<T>): void {
        const ymap = this.map.get(id);
        if (!ymap) return;
        for (const [key, value] of Object.entries(partial)) {
            if (value === undefined) continue;
            if (key === "tagIds" && Array.isArray(value)) {
                applySet(ymap, value as string[]);
            } else {
                ymap.set(key, value);
            }
        }
    }
    delete(id: Id): void {
        this.map.delete(id);
    }
    ids(): Id[] {
        return [...this.map.keys()];
    }
}

/** Diff a tag array into the record's tag sub-map for conflict-free set merges. */
function applySet(record: Y.Map<unknown>, desired: string[]): void {
    const existing = record.get("tagIds");
    const set: Y.Map<unknown> =
        existing instanceof Y.Map ? existing : new Y.Map<unknown>();
    if (!(existing instanceof Y.Map)) record.set("tagIds", set);
    const want = new Set(desired);
    for (const key of [...set.keys()]) if (!want.has(key)) set.delete(key);
    for (const id of want) if (!set.has(id)) set.set(id, true);
}

class YjsDocument implements CrdtDocument {
    private readonly cols: Record<DocCollection, Y.Map<Y.Map<unknown>>>;
    private readonly ymeta: Y.Map<unknown>;
    private readonly listeners = new Set<(change: DocChange) => void>();
    private readonly pending = new Set<DocCollection>();
    private deviceId: string;

    constructor(
        private readonly doc: Y.Doc,
        deviceId: string,
    ) {
        this.deviceId = deviceId;
        this.cols = Object.fromEntries(
            DOC_COLLECTIONS.map((c) => [c, doc.getMap(c)]),
        ) as Record<DocCollection, Y.Map<Y.Map<unknown>>>;
        this.ymeta = doc.getMap("meta");
        for (const c of DOC_COLLECTIONS) {
            this.cols[c].observeDeep(() => this.pending.add(c));
        }
        doc.on("afterTransaction", (tr: Y.Transaction) => {
            if (this.pending.size === 0 || this.listeners.size === 0) return;
            const change: DocChange = {
                origin: tr.origin === LOCAL ? "local" : "remote",
                changed: new Set(this.pending),
            };
            this.pending.clear();
            for (const l of this.listeners) l(change);
        });
    }

    private tx(): DocTx {
        const meta: MetaMap = {
            get: <K extends keyof DocMeta>(k: K): DocMeta[K] | undefined => {
                if (k === "schemaVersion")
                    return ((this.ymeta.get("schemaVersion") as number) ??
                        CORE_SCHEMA_VERSION) as DocMeta[K];
                return this.deviceId as DocMeta[K];
            },
            set: <K extends keyof DocMeta>(k: K, v: DocMeta[K]): void => {
                if (k === "schemaVersion") this.ymeta.set("schemaVersion", v);
                else this.deviceId = v as string;
            },
        };
        return {
            workspaces: new YRecordMap(this.cols.workspaces),
            folders: new YRecordMap(this.cols.folders),
            groups: new YRecordMap(this.cols.groups),
            tabs: new YRecordMap(this.cols.tabs),
            tags: new YRecordMap(this.cols.tags),
            meta,
        };
    }

    mutate(fn: (tx: DocTx) => void): Uint8Array {
        const before = Y.encodeStateVector(this.doc);
        this.doc.transact(() => fn(this.tx()), LOCAL);
        return Y.encodeStateAsUpdate(this.doc, before);
    }

    applyUpdate(
        update: Uint8Array,
        origin: "local" | "remote" = "remote",
    ): boolean {
        const before = Y.encodeStateVector(this.doc);
        Y.applyUpdate(this.doc, update, origin === "local" ? LOCAL : "remote");
        return !arraysEqual(before, Y.encodeStateVector(this.doc));
    }

    encodeState(): Uint8Array {
        return Y.encodeStateAsUpdate(this.doc);
    }
    stateVector(): Uint8Array {
        return Y.encodeStateVector(this.doc);
    }
    encodeStateSince(stateVector: Uint8Array): Uint8Array {
        return Y.encodeStateAsUpdate(this.doc, stateVector);
    }

    snapshot(): DocSnapshot {
        const read = (c: DocCollection): Record<Id, AnyRecord> => {
            const out: Record<Id, AnyRecord> = {};
            this.cols[c].forEach((ymap, id) => {
                out[id] = yMapToRecord(ymap);
            });
            return out;
        };
        return {
            schemaVersion:
                (this.ymeta.get("schemaVersion") as number) ??
                CORE_SCHEMA_VERSION,
            workspaces: read("workspaces"),
            folders: read("folders"),
            groups: read("groups"),
            tabs: read("tabs"),
            tags: read("tags"),
        } as DocSnapshot;
    }

    subscribe(listener: (change: DocChange) => void): Unsubscribe {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    destroy(): void {
        this.listeners.clear();
        this.doc.destroy();
    }
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

export const yjsAdapter: CrdtAdapter = {
    create(deviceId: string): CrdtDocument {
        const doc = new Y.Doc();
        const document = new YjsDocument(doc, deviceId);
        document.mutate((tx) => {
            tx.meta.set("schemaVersion", CORE_SCHEMA_VERSION);
            tx.meta.set("deviceId", deviceId);
        });
        return document;
    },
    load(deviceId: string, state: Uint8Array): CrdtDocument {
        const doc = new Y.Doc();
        Y.applyUpdate(doc, state);
        return new YjsDocument(doc, deviceId);
    },
};
