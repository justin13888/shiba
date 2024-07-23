import type { Tab, TabGroup } from "@/types/model";
import { type DBSchema, openDB } from "idb";
import { nanoid } from "nanoid";

const logger = new Logger(import.meta.url);

export interface ShibaSnapshotOptions {
    /** Unique ID */
    id?: string;
    /** String identifying device/browser */
    identifier: string;
    /** Unix timestamp in milliseconds */
    timestamp: number;
    /** Retention policies triggered by ID */
    triggers: string[];

    /** Tabs */
    tabs: Tab[];
    /** Tab Groups */
    tabGroups: TabGroup[];
}

export class ShibaSnapshot implements ShibaExport {
    /** Unique ID */
    id: string;
    /** String identifying device/browser */
    identifier: string;
    /** Unix timestamp in milliseconds */
    timestamp: number;
    /** Retention policies triggered by ID */
    triggers: string[];

    /** Tabs */
    tabs: Tab[];
    /** Tab Groups */
    tabGroups: TabGroup[];

    constructor({
        id,
        identifier,
        timestamp,
        triggers,
        tabs,
        tabGroups,
    }: ShibaSnapshotOptions) {
        this.id = id || nanoid();
        this.identifier = identifier;
        this.timestamp = timestamp;
        this.triggers = triggers;
        this.tabs = tabs;
        this.tabGroups = tabGroups;
    }
}

export interface RetentionPolicyOptions {
    /** Unique ID */
    id?: string;
    /** Snapshot frequency in minutes */
    frequency: number;
    /** Time to retain snapshots in minutes */
    retain: number;
}

export class RetentionPolicy {
    /** Unique ID */
    id: string;
    /** Snapshot frequency in minutes */
    frequency: number;
    /** Time to retain snapshots in minutes */
    retain: number;

    constructor({ id, frequency, retain }: RetentionPolicyOptions) {
        if (frequency <= 0) {
            throw new Error("Frequency must be positive");
        }
        if (retain < frequency) {
            throw new Error(
                "Retention must be greater than or equal to frequency",
            );
        }

        this.id = id || nanoid();
        this.frequency = frequency;
        this.retain = retain;
    }

    /**
     * Check if a retention policy is triggered by a snapshot
     * @param snapshot Snapshot to check
     * @returns True if triggered
     */
    isTriggered(snapshot: ShibaSnapshot): boolean {
        return snapshot.triggers.includes(this.id);
    }

    /**
     * Get next timestamp for a snapshot based on last snapshot's timestamp
     * @param timestamp Last snapshot's timestamp
     * @returns Next snapshot's timestamp
     */
    getNextTimestamp(timestamp: number): number {
        return timestamp + this.frequency * 60 * 1000;
    }
}

interface SnapshotDB extends DBSchema {
    snapshots: {
        key: string;
        value: ShibaSnapshot;
        indexes: {
            byTimestamp: number;
        };
    };
}

// Initialize IndexedDB
const dbPromise = openDB<SnapshotDB>("snapshots", 1, {
    upgrade(db) {
        const snapshotStore = db.createObjectStore("snapshots", {
            keyPath: "id",
        });
        snapshotStore.createIndex("byTimestamp", "timestamp");
    },
});

// TODO: Test
/**
 * Add snapshot to database.
 * @param snapshot Snapshot to add
 */
const addSnapshot = async (snapshot: ShibaSnapshot) => {
    logger.trace("Adding snapshot", snapshot);

    const db = await dbPromise;
    const tx = db.transaction("snapshots", "readwrite");
    const store = tx.objectStore("snapshots");

    store.add(snapshot);

    await tx.done;
    logger.trace("Snapshot added successfully:", snapshot);
};

/**
 * @param id Snapshot ID
 * @returns Snapshot with ID if found
 */
export const getSnapshot = async (
    id: string,
): Promise<ShibaSnapshot | undefined> => {
    const db = await dbPromise;
    return db.get("snapshots", id);
};

// TODO: Test
/**
 * Get snapshots in order of newest to oldest.
 * @returns Snapshots from newest to oldest
 */
export const getSnapshots = async (): Promise<ShibaSnapshot[]> => {
    const db = await dbPromise;
    const tx = db.transaction("snapshots", "readonly");
    const store = tx.objectStore("snapshots");
    const index = store.index("byTimestamp");

    const snapshots: ShibaSnapshot[] = [];

    let cursor = await index.openCursor(null, "prev"); // 'prev' for descending order
    while (cursor) {
        snapshots.push(cursor.value);
        cursor = await cursor.continue();
    }

    await tx.done;
    return snapshots;
};

/**
 * Generate manual snapshot
 */
export const generateManualSnapshot = async () => {
    const snapshot = new ShibaSnapshot({
        identifier: "unknown", // TODO: Fetch identifier from settings
        timestamp: Date.now(),
        triggers: [],
        tabs: await getAllTabs(),
        tabGroups: await getAllTabGroups(),
    });
    await addSnapshot(snapshot);
};

// TODO: Test
/**
 * Delete a snapshot
 * @param id Snapshot ID
 */
const deleteSnapshot = async (id: string) => {
    const db = await dbPromise;
    const tx = db.transaction("snapshots", "readwrite");
    const store = tx.objectStore("snapshots");

    await store.delete(id);

    await tx.done;
};

// TODO: Test
/**
 * Generate and clean up snapshots based on TabDB, SnapshotDB and RetentionPolicy[]
 * @param retentionPolicies Retention policies to trigger snapshots
 */
export const runSnapshot = async (
    retentionPolicies: RetentionPolicy[],
): Promise<ShibaSnapshot | undefined> => {
    if (retentionPolicies.length === 0) {
        throw new Error("No retention policies provided");
    }

    // Fetch all snapshots and tabs
    const snapshots = await getSnapshots();
    await snapshots.sort((a, b) => b.timestamp - a.timestamp);
    logger.trace("Snapshots fetched:", snapshots);

    // Generate snapshot if necessary
    let newSnapshot: ShibaSnapshot | undefined = undefined;
    if (snapshots.length === 0) {
        // All retention policies are triggered
        newSnapshot = new ShibaSnapshot({
            identifier: "unknown", // TODO: Fetch identifier from settings
            timestamp: Date.now(),
            triggers: retentionPolicies.map((policy) => policy.id),
            tabs: await getAllTabs(),
            tabGroups: await getAllTabGroups(),
        });
        logger.trace("New snapshot:", newSnapshot);
        await addSnapshot(newSnapshot);
    } else {
        // See which retention policies need to be triggered
        // Since browser is not consistently open, snapshots are taken eagerly
        // We take a snapshot if last one is too old
        // We retrain snapshots if it follows the retention policy
        const triggers = retentionPolicies
            .filter(
                (policy) =>
                    policy.getNextTimestamp(snapshots[0].timestamp) <
                    Date.now(),
            )
            .map((policy) => policy.id);
        if (triggers.length > 0) {
            newSnapshot = new ShibaSnapshot({
                identifier: "unknown", // TODO: Fetch identifier from settings
                timestamp: Date.now(),
                triggers,
                tabs: await getAllTabs(),
                tabGroups: await getAllTabGroups(),
            });
            logger.trace("New snapshot:", newSnapshot);
            await addSnapshot(newSnapshot);
        }
    }

    // Clean up old snapshots
    const expiredSnapshots: ShibaSnapshot[] = [];
    for (const snapshot of snapshots) {
        const isValid = retentionPolicies.some(
            (policy) =>
                policy.isTriggered(snapshot) &&
                policy.retain * 60 * 1000 + snapshot.timestamp > Date.now(),
        );
        if (!isValid) {
            expiredSnapshots.push(snapshot);
        }
    }
    logger.trace("Expired snapshots:", expiredSnapshots);

    // Delete expired snapshots
    for (const snapshot of expiredSnapshots) {
        await deleteSnapshot(snapshot.id);
    }

    return newSnapshot;
};
