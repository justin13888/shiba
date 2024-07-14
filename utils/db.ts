import { TabDB } from "@/types/schema";
import { openDB } from "idb";
import { TabGroup, Tab } from "@/types/model";

export const dbPromise = openDB<TabDB>("tabs", 1, {
    upgrade(db) {
        const tabStore = db.createObjectStore("tabs", { keyPath: "groupId" });
        tabStore.createIndex("byTimeCreated", "timeCreated");
    },
});

export const appendTabs = async (tabGroups: TabGroup[]) => {
    console.log("Appending tabs:", tabGroups);

    const db = await dbPromise;
    const tx = db.transaction("tabs", "readwrite"); // Ensure readwrite transaction
    const store = tx.objectStore("tabs");

    for (const tabGroup of tabGroups) {
        // Use add() for new entries or put() with overwrite for existing
        store.add(tabGroup); // Or store.put(tabGroup, { overwrite: true });
    }

    await tx.done; // Wait for the transaction to complete
    console.log("Tabs appended successfully");
};

export const getTabs = async (num?: number): Promise<TabGroup[]> => {
    const db = await dbPromise;
    const tx = db.transaction('tabs', 'readonly');
    const store = tx.objectStore('tabs');
    const index = store.index('byTimeCreated');
    
    const tabs: TabGroup[] = [];
    let cursor = await index.openCursor();

    if (num !== undefined) {
        while (cursor && tabs.length < num) {
            tabs.push(cursor.value);
            cursor = await cursor.continue();
        }
    } else {
        while (cursor) {
            tabs.push(cursor.value);
            cursor = await cursor.continue();
        }
    }

    return tabs;
};

export const getTabCount = async (): Promise<number> => {
    const db = await dbPromise;
    const tx = db.transaction("tabs", "readonly");
    const store = tx.objectStore("tabs");

    return await store.count();
};
