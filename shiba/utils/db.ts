import type { Tab, TabBundle, TabGroup } from "@/types/model";
import type { TabDB } from "@/types/schema";
import { openDB } from "idb";
import { Logger } from "./logger";

// TODO: Implement db versioning
// TODO: Implement trash for tab and tab groups

const logger = new Logger(import.meta.url);

const dbPromise = openDB<TabDB>("tabs", 1, {
    upgrade(db) {
        const workspaceStore = db.createObjectStore("workspace", {
            keyPath: "id",
        });
        workspaceStore.createIndex("byOrder", "order");

        const tabGroupStore = db.createObjectStore("tabGroups", {
            keyPath: "id",
        });
        tabGroupStore.createIndex("byTimeCreated", "timeCreated");
        tabGroupStore.createIndex("byTimeModified", "timeModified");

        const tabStore = db.createObjectStore("tabs", { keyPath: "id" });
        tabStore.createIndex("byGroupId", "groupId");
        tabStore.createIndex("byGroupIdOrder", ["groupId", "order"]);
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
    // TODO: might want to omit `order` field
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
export const deleteTabGroup = async (tabGroupId: string): Promise<boolean> => {
    const db = await dbPromise;
    console.log("Deleting tab group:", tabGroupId);

    // Delete tabs with tab.groupId === tabGroupId
    const tabs = await getTabsById(tabGroupId);
    const tx = db.transaction(["tabs", "tabGroups"], "readwrite");
    const tabsStore = tx.objectStore("tabs");
    for (const { id: tabId } of tabs) {
        console.log("Deleting tab:", tabId);
        tabsStore.delete(tabId);
    }
    // Delete tab group with tabGroupId
    const tabGroupsStore = tx.objectStore("tabGroups");
    tabGroupsStore.delete(tabGroupId);

    await tx.done;

    return true;
};

/**
 * Delete a tab and tab group if empty from the database.
 * @param tabId Tab ID
 * @returns True if tab was deleted, false if tab was not found.
 */
export const deleteTab = async (tabId: string): Promise<boolean> => {
    const db = await dbPromise;
    // Check if tab exists
    const tab = await getTabById(tabId);
    if (tab === undefined) {
        return false;
    }

    const tx = db.transaction("tabs", "readwrite");
    const store = tx.objectStore("tabs");
    store.delete(tabId);
    await tx.done;

    // Delete tab group if it is empty
    const tabs = await getTabsById(tab.groupId);
    const tabGroupsTx = db.transaction("tabGroups", "readwrite");
    const tabGroupsStore = tabGroupsTx.objectStore("tabGroups");
    if (!tabs) {
        tabGroupsStore.delete(tab.groupId);
    }
    await tabGroupsTx.done;

    return true;
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
 * @param tabGroupId Tab Group ID
 * @return Tab object
 */
export const getTabsById = async (tabGroupId: string): Promise<Tab[]> => {
    const db = await dbPromise;
    const tx = db.transaction("tabs", "readonly");
    const store = tx.objectStore("tabs");
    const index = store.index("byGroupIdOrder");
    const range = IDBKeyRange.bound(
        [tabGroupId, Number.NEGATIVE_INFINITY],
        [tabGroupId, Number.POSITIVE_INFINITY],
    );
    const items = [];

    let cursor = await index.openCursor(range);

    while (cursor) {
        items.push(cursor.value);
        cursor = await cursor.continue();
    }

    await tx.done;

    return items;
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
    // TODO: Make it possible to paginate, sort, filter, etc.
    const db = await dbPromise;
    const tx = db.transaction("tabGroups", "readonly");
    const store = tx.objectStore("tabGroups");
    const index = store.index("byTimeCreated");
    return index.getAll().then((obj) => obj.reverse());
};

export const getTabCount = async (): Promise<number> => {
    const db = await dbPromise;
    const tx = db.transaction("tabs", "readonly");
    const store = tx.objectStore("tabs");

    return await store.count();
};

// TODO: Deprecate this function
export const addTabBundle = ([tabGroup, tabs]: TabBundle) => {
    addTabGroup(tabGroup);
    addTabs(tabs);
};

// TODO: Handle when tabGroupId in a Tab object is not found
