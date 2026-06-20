import type { Snapshot } from "@shiba/core";
import { describe, expect, it } from "vitest";
import { createIdbStores } from "./index";

let counter = 0;
const fresh = () => createIdbStores(`test-${counter++}`);

describe("IdbDocStore", () => {
    it("appends and loads updates, then compacts to a baseline", async () => {
        const { docStore } = fresh();
        await docStore.appendUpdate("d", Uint8Array.of(1));
        await docStore.appendUpdate("d", Uint8Array.of(2));

        let loaded = await docStore.load("d");
        expect(loaded.updates).toHaveLength(2);
        expect(loaded.snapshot).toBeUndefined();

        await docStore.compact("d", Uint8Array.of(9));
        loaded = await docStore.load("d");
        expect(loaded.snapshot).toEqual(Uint8Array.of(9));
        expect(loaded.updates).toHaveLength(0);
    });

    it("scopes updates by docId", async () => {
        const { docStore } = fresh();
        await docStore.appendUpdate("a", Uint8Array.of(1));
        await docStore.appendUpdate("b", Uint8Array.of(2));
        expect((await docStore.load("a")).updates).toHaveLength(1);
    });
});

describe("IdbSnapshotStore", () => {
    const snap = (id: string, createdAt: number): Snapshot => ({
        id,
        createdAt,
        deviceId: "d",
        triggers: [],
        tabCount: 0,
        groupCount: 0,
        state: Uint8Array.of(createdAt),
    });

    it("stores, lists newest-first, and deletes", async () => {
        const { snapshots } = fresh();
        await snapshots.put(snap("s1", 1));
        await snapshots.put(snap("s2", 2));

        expect((await snapshots.list()).map((m) => m.id)).toEqual(["s2", "s1"]);
        expect((await snapshots.get("s1"))?.state).toEqual(Uint8Array.of(1));

        await snapshots.delete("s1");
        expect(await snapshots.get("s1")).toBeUndefined();
    });
});
