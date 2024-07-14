import { Tab, TabGroup } from '@/types/model';

/**
 * Save the current tab to the database.
 * @returns Saved current tab ID.
 * @throws If the tab title or URL is undefined.
 */
export const saveCurrentTab = async (): Promise<number | undefined> => {
    // TODO: Implement filtering (blocking certain URL matches like extension pages)
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length > 0) {
        const tab = tabs[0];
        const [currentTab, tabId] = browserTabToShibaTab(tab);
        
        const newTabGroup = new TabGroup({
            tabs: [currentTab],
        });
        appendTabs([newTabGroup]);

        return tabId;
    } else {
        return undefined;
    }
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

    const savedTabs: Tab[] = [];
    const savedTabIds: number[] = [];
    
    tabs.map(browserTabToShibaTab)
        .reduce(([tabs, tabIds], [tab, tabId]) => {
            tabs.push(tab);
            if (tabId !== undefined) {
                tabIds.push(tabId);
            }
            return [tabs, tabIds];
        }, [savedTabs, savedTabIds]);

    const newTabGroup = new TabGroup({
        tabs: savedTabs,
    });
    
    appendTabs([newTabGroup]);
    
    return savedTabIds;
};

// TODO: Implement option for saving tabs highlighted

import { Tabs } from 'webextension-polyfill';
const browserTabToShibaTab = (tab: Tabs.Tab): [Tab, number | undefined] => {
    const title = tab.title;
    const url = tab.url;
    const favicon = tab.favIconUrl;
    if (title && url) {
        return [
            new Tab({
                title,
                url,
                favicon,
            }),
            tab.id,
        ];
    } else {
        throw new Error(`Tab title or URL is undefined: ${title}, ${url}`);
    }
};
