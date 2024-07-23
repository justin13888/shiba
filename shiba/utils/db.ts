import type { Tab, TabBundle, TabGroup } from "@/types/model";
import type { TabDB } from "@/types/schema";
import { openDB } from "idb";

// TODO: Implement db versioning

const logger = new Logger(import.meta.url);

const dbPromise = openDB<TabDB>("tabs", 1, {
    upgrade(db) {
        const tabGroupStore = db.createObjectStore("tabGroups", {
            keyPath: "groupId",
        });
        tabGroupStore.createIndex("byTimeCreated", "timeCreated");
        tabGroupStore.createIndex("byTimeModified", "timeModified");

        const tabStore = db.createObjectStore("tabs", { keyPath: "id" });
    },
});

/**
 * Add a tab group to the database.
 * @param tabGroup
 */
export const addTabGroup = async (tabGroup: TabGroup) => {
    logger.debug("Adding tab group:", tabGroup);

    const db = await dbPromise;
    const tx = db.transaction("tabGroups", "readwrite");
    const store = tx.objectStore("tabGroups");

    store.add(tabGroup);

    await tx.done;
    logger.debug("Tab group added successfully");
};

/**
 * Add tabs to the database.
 * @param tabs
 */
export const addTabs = async (tabs: Tab[]) => {
    logger.debug("Adding tabs:", tabs);

    const db = await dbPromise;
    const tx = db.transaction("tabs", "readwrite");
    const store = tx.objectStore("tabs");

    for (const tab of tabs) {
        store.add(tab);
    }

    await tx.done;
    logger.debug("Tabs added successfully");
};

/**
 * Delete a tab group from the database and all associated tabs.
 * @param tabGroupId Tab Group ID
 * @returns True if tab group was deleted, false if tab group was not found.
 */
export const deleteTabGroup = async (tabGroupId: string) => {
    const tabGroup = await getTabGroupById(tabGroupId);
    if (tabGroup === undefined) {
        return;
    }

    const db = await dbPromise;

    // Delete tabs with tabGroupId
    const tabsTx = db.transaction("tabs", "readwrite");
    const tabsStore = tabsTx.objectStore("tabs");
    for (const tabId of tabGroup.tabs) {
        await tabsStore.delete(tabId);
    }

    // Delete tab group with tabGroupId
    const tabGroupsTx = db.transaction("tabGroups", "readwrite");
    const tabGroupsStore = tabGroupsTx.objectStore("tabGroups");
    await tabGroupsStore.delete(tabGroupId);

    await tabsTx.done;
    await tabGroupsTx.done;
};

/**
 * Delete all tabs from the database.
 */
export const clearTabs = async () => {
    const db = await dbPromise;
    const tabsTx = db.transaction("tabs", "readwrite");
    const tabStore = tabsTx.objectStore("tabs");
    tabStore.clear();
    await tabsTx.done;

    const tabGroupsTx = db.transaction("tabGroups", "readwrite");
    const tabGroupsStore = tabGroupsTx.objectStore("tabGroups");
    tabGroupsStore.clear();
    await tabGroupsTx.done;

    logger.debug("All tabs cleared");
};

/**
 *
 * @returns List of all tabs
 */
export const getAllTabs = async (): Promise<Tab[]> => {
    const db = await dbPromise;
    return db.getAll("tabs");
};

/**
 * Get tab by ID.
 * @param tabId Tab ID
 * @return Tab object
 */
export const getTabById = async (tabId: string): Promise<Tab | undefined> => {
    const db = await dbPromise;
    return db.get("tabs", tabId);
};

/**
 * Get tabs by IDs.
 * @param tabIds Tab IDs
 * @return Tab object
 */
export const getTabsByIds = async (tabIds: string[]): Promise<Tab[]> => {
    const db = await dbPromise;
    const tx = db.transaction("tabs", "readonly");
    const store = tx.objectStore("tabs");

    const tabs = await Promise.all(tabIds.map((tabId) => store.get(tabId)));

    return tabs.filter((tab) => tab !== undefined) as Tab[];
};

/**
 * Get tab group by ID.
 * @param tabGroupId Tab Group ID
 * @returns Array of tabs
 */
export const getTabGroupById = async (
    tabGroupId: string,
): Promise<TabGroup | undefined> => {
    const db = await dbPromise;
    return db.get("tabGroups", tabGroupId);
};

/**
 * @returns List of all tab groups
 */
export const getAllTabGroups = async (): Promise<TabGroup[]> => {
    const db = await dbPromise;
    return db.getAll("tabGroups");
};

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
