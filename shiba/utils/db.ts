import type { TabDB } from "@/types/schema";
import { openDB } from "idb";
import type { TabBundle, TabGroup } from "@/types/model";

export const dbPromise = openDB<TabDB>("tabs", 1, {
    upgrade(db) {
        const tabGroupStore = db.createObjectStore('tabGroups', { keyPath: 'groupId' });
        tabGroupStore.createIndex('byTimeCreated', 'timeCreated');

        const tabStore = db.createObjectStore("tabs", { keyPath: "id" });
        tabStore.createIndex("byTabGroupId", "tabGroupId");
    },
});

/**
 * Add a tab group to the database.
 * @param tabGroup 
 */
export const addTabGroup = async (tabGroup: TabGroup) => {
    console.log("Adding tab group:", tabGroup);

    const db = await dbPromise;
    const tx = db.transaction("tabGroups", "readwrite");
    const store = tx.objectStore("tabGroups");

    store.add(tabGroup);

    await tx.done;
    console.log("Tab group added successfully");
};

/**
 * Add tabs to the database.
 * @param tabs 
 */
export const addTabs = async (tabs: Tab[]) => {
    console.log("Adding tabs:", tabs);

    const db = await dbPromise;
    const tx = db.transaction("tabs", "readwrite");
    const store = tx.objectStore("tabs");

    for (const tab of tabs) {
        store.add(tab);
    }

    await tx.done;
    console.log("Tabs added successfully");
};

export const deleteTabGroup = async (tabGroupId: string) => {
    const db = await dbPromise;
    
    
    // Delete tabs with tabGroupId
    const tabsTx = db.transaction('tabs', 'readwrite');
    const tabsStore = tabsTx.objectStore('tabs');
    const tabsIndex = tabsStore.index('byTabGroupId');
    const tabsRange = IDBKeyRange.only(tabGroupId);
    let cursor = await tabsIndex.openCursor(tabsRange);
    while (cursor) {
        cursor.delete();
        cursor = await cursor.continue();
    }
    await tabsTx.done;

    // Delete tab group with tabGroupId
    const tabGroupsTx = db.transaction('tabGroups', 'readwrite');
    const tabGroupsStore = tabGroupsTx.objectStore('tabGroups');
    await tabGroupsStore.delete(tabGroupId);
    await tabGroupsTx.done;
};

// TODO: Check
/**
 * Get tabs from the database.
 * @param num Number of tab groups to get.
 * @returns Array of bundles
 */
export const getTabs = async (num?: number): Promise<TabBundle[]> => {
    const db = await dbPromise;
    const tx = db.transaction('tabGroups', 'readonly');
    const store = tx.objectStore('tabGroups');
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

    return Promise.all(tabs.map(async (tabGroup) => {
        const tabList = await getTabsByGroup(tabGroup.groupId);
        return [tabGroup, tabList] as TabBundle;
    }));
};

export const getTabsByGroup = async (tabGroupId: string): Promise<Tab[]> => {
    const db = await dbPromise;
    return db.getAllFromIndex("tabs", "byTabGroupId", tabGroupId);
}

export const getTabCount = async (): Promise<number> => {
    const db = await dbPromise;
    const tx = db.transaction("tabs", "readonly");
    const store = tx.objectStore("tabs");

    return await store.count();
};

export const addTabBundle = ([tabGroup, tabs]: TabBundle) => {
    addTabGroup(tabGroup);
    addTabs(tabs);
};

// TODO: Handle when tabGroupId in a Tab object is not found