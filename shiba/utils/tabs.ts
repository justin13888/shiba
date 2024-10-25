import { Tab, type TabBundle, TabGroup } from "@/types/model";
import { addTabBundle } from "@/utils/db";
import type { Tabs } from "webextension-polyfill";
import { browser } from "wxt/browser";

// TODO: Implement filtering (blocking certain URL matches like extension pages)

/**
 * Save the selected tab to the database.
 * @returns Browser tab IDs of selected tabs.
 */
export const storeSelectedTabs = async (): Promise<number[]> => {
    const tabs = await browser.tabs.query({
        highlighted: true,
        currentWindow: true,
    });

    return saveTabs(tabs);
};

/**
 * Save all tabs in current window to the database.
 * @returns Saved tab IDs.
 * @throws If a tab title or URL is undefined.
 */
export const saveCurrentWindow = async (): Promise<number[]> => {
    // TODO: Finish working implementation
    const tabs = await browser.tabs.query({ currentWindow: true });

    return saveTabs(tabs);
};

/**
 * Save selected tabs to the database.
 * @return Saved tab IDs or undefined if no tabs are highlighted.
 */
export const saveSelectedTabs = async (): Promise<number[] | undefined> => {
    const tabs = await browser.tabs.query({
        highlighted: true,
        currentWindow: true,
    });
    if (tabs.length > 0) {
        return saveTabs(tabs);
    }

    return undefined;
};

/**
 *
 * @param tabs Tabs to save
 * @returns Saved tab IDs
 */
export const saveTabs = async (tabs: Tabs.Tab[]): Promise<number[]> => {
    const newTabGroup = new TabGroup();

    const savedTabs: Tab[] = [];
    const savedBrowserTabIds: number[] = [];

    for (const [index, tab] of tabs.entries()) {
        const [currentTab, browserTabId] = browserTabToShibaTab(
            tab,
            newTabGroup.id,
            index,
        );
        savedTabs.push(currentTab);
        if (browserTabId !== undefined) {
            savedBrowserTabIds.push(browserTabId);
        }
    }

    addTabBundle([newTabGroup, savedTabs]);

    return savedBrowserTabIds;
};

/**
 * Convert browser Tab to Shiba Tab.
 * @param tab Browser Tab
 * @returns [Shiba Tab, browser Tab ID]
 */
const browserTabToShibaTab = (
    tab: Tabs.Tab,
    tabGroupId: string,
    index: number,
): [Tab, number | undefined] => {
    const title = tab.title;
    const url = tab.url;
    const favicon = tab.favIconUrl;
    if (title && url) {
        return [
            new Tab({
                groupId: tabGroupId,
                order: index,
                title,
                url,
                favicon,
            }),
            tab.id,
        ];
    }

    throw new Error(`Tab title or URL is undefined: ${title}, ${url}`);
};
