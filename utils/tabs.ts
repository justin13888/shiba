import { Tab, type TabBundle, TabGroup } from '@/types/model';
import { addTabBundle } from '@/utils/db';

/**
 * Save the current tab to the database.
 * @returns Saved current tab ID.
 * @throws If the tab title or URL is undefined.
 */
export const saveCurrentTab = async (): Promise<number | undefined> => {
    // TODO: Implement filtering (blocking certain URL matches like extension pages)
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length > 0) {
        const newTabGroup = new TabGroup();
        
        const tab = tabs[0];
        const [currentTab, tabId] = browserTabToShibaTab(tab, newTabGroup.groupId);
        
        addTabBundle([newTabGroup, [currentTab]]);

        return tabId;
    }
    
    return undefined;
};

/**
 * Save all tabs in current window to the database.
 * @returns Saved tab IDs.
 * @throws If a tab title or URL is undefined.
 */
export const saveAllTabs = async () => {
    // TODO: Finish working implementation
    // TODO: Implement filtering (blocking certain URL matches like extension pages)
    const tabs = await browser.tabs.query({ currentWindow: true });

    const newTabGroup = new TabGroup();

    const savedTabs: Tab[] = [];
    const savedTabIds: number[] = [];
    
    for (const tab of tabs) {
        const [currentTab, tabId] = browserTabToShibaTab(tab, newTabGroup.groupId);
        savedTabs.push(currentTab);
        if (tabId !== undefined) {
            savedTabIds.push(tabId);
        }
    }

    addTabBundle([newTabGroup, savedTabs]);
    
    return savedTabIds;
};

// TODO: Implement option for saving tabs highlighted


import type { Tabs } from 'webextension-polyfill';
import { addTabGroup, addTabs } from './db';
/**
 * Convert browser Tab to Shiba Tab.
 * @param tab Browser Tab
 * @param tabGroupId Tab group ID to assign to the Shiba Tab
 * @returns [Shiba Tab, browser Tab ID]
 */
const browserTabToShibaTab = (tab: Tabs.Tab, tabGroupId: string): [Tab, number | undefined] => {
    const title = tab.title;
    const url = tab.url;
    const favicon = tab.favIconUrl;
    if (title && url) {
        return [
            new Tab({
                title,
                url,
                favicon,
                tabGroupId
            }),
            tab.id,
        ];
    }
    
    throw new Error(`Tab title or URL is undefined: ${title}, ${url}`);
};
