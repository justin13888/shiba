import type {
    DocStore,
    PersistedDoc,
    Snapshot,
    SnapshotMeta,
    SnapshotStore,
} from "@shiba/core";
import { type DBSchema, type IDBPDatabase, openDB } from "idb";

interface ShibaDB extends DBSchema {
    docUpdates: {
        key: number;
        value: { docId: string; update: Uint8Array };
        indexes: { byDoc: string };
    };
    docSnapshot: {
        key: string;
        value: { docId: string; snapshot: Uint8Array };
    };
    snapMeta: {
        key: string;
        value: SnapshotMeta;
        indexes: { byCreatedAt: number };
    };
    snapState: { key: string; value: { id: string; state: Uint8Array } };
}

type Db = IDBPDatabase<ShibaDB>;

function openShibaDb(name: string): Promise<Db> {
    return openDB<ShibaDB>(name, 1, {
        upgrade(db) {
            db.createObjectStore("docUpdates", {
                autoIncrement: true,
            }).createIndex("byDoc", "docId");
            db.createObjectStore("docSnapshot", { keyPath: "docId" });
            db.createObjectStore("snapMeta", { keyPath: "id" }).createIndex(
                "byCreatedAt",
                "createdAt",
            );
            db.createObjectStore("snapState", { keyPath: "id" });
        },
    });
}

/** Local CRDT persistence: a compacted baseline plus an append-only update log. */
class IdbDocStore implements DocStore {
    constructor(private readonly db: Promise<Db>) {}

    async load(docId: string): Promise<PersistedDoc> {
        const db = await this.db;
        const snapshotRow = await db.get("docSnapshot", docId);
        const updateRows = await db.getAllFromIndex(
            "docUpdates",
            "byDoc",
            docId,
        );
        return {
            snapshot: snapshotRow?.snapshot,
            updates: updateRows.map((r) => r.update),
        };
    }

    async appendUpdate(docId: string, update: Uint8Array): Promise<void> {
        await (await this.db).add("docUpdates", { docId, update });
    }

    async compact(docId: string, snapshot: Uint8Array): Promise<void> {
        const db = await this.db;
        const tx = db.transaction(["docSnapshot", "docUpdates"], "readwrite");
        await tx.objectStore("docSnapshot").put({ docId, snapshot });
        const index = tx.objectStore("docUpdates").index("byDoc");
        let cursor = await index.openCursor(docId);
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }
        await tx.done;
    }
}

/** Immutable point-in-time snapshots; metadata and blob stored separately. */
class IdbSnapshotStore implements SnapshotStore {
    constructor(private readonly db: Promise<Db>) {}

    async put(snapshot: Snapshot): Promise<void> {
        const db = await this.db;
        const { state, ...meta } = snapshot;
        const tx = db.transaction(["snapMeta", "snapState"], "readwrite");
        await tx.objectStore("snapMeta").put(meta);
        await tx.objectStore("snapState").put({ id: snapshot.id, state });
        await tx.done;
    }

    async get(id: string): Promise<Snapshot | undefined> {
        const db = await this.db;
        const meta = await db.get("snapMeta", id);
        const stateRow = await db.get("snapState", id);
        if (!meta || !stateRow) return undefined;
        return { ...meta, state: stateRow.state };
    }

    async list(): Promise<SnapshotMeta[]> {
        const all = await (await this.db).getAllFromIndex(
            "snapMeta",
            "byCreatedAt",
        );
        return all.reverse();
    }

    async delete(id: string): Promise<void> {
        const db = await this.db;
        const tx = db.transaction(["snapMeta", "snapState"], "readwrite");
        await tx.objectStore("snapMeta").delete(id);
        await tx.objectStore("snapState").delete(id);
        await tx.done;
    }
}

export interface IdbStores {
    docStore: DocStore;
    snapshots: SnapshotStore;
}

/** Open (or create) the Shiba IndexedDB and return both stores sharing it. */
export function createIdbStores(name = "shiba"): IdbStores {
    const db = openShibaDb(name);
    return {
        docStore: new IdbDocStore(db),
        snapshots: new IdbSnapshotStore(db),
    };
}
