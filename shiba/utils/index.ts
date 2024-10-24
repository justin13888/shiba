import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import type { Tabs } from "webextension-polyfill";

const logger = new Logger(import.meta.url);

/**
 * Switch to or open tab
 * @param url
 */
export const switchToOrOpenTab = async (url: string): Promise<Tabs.Tab> => {
    const existingTab = await (async () => {
        // Check if current tab is url
        const currentTab = await browser.tabs.getCurrent();
        if (currentTab && currentTab.url === url) {
            return currentTab;
        }

        // Check current window
        const currentTabs = await browser.tabs
            .query({ currentWindow: true })
            .then((tabs) => tabs.filter((tab) => tab.url?.startsWith(url)));
        if (currentTabs.length > 0) {
            return browser.tabs.update(currentTabs[0].id, { active: true });
        }

        // Check all tabs
        const allTabs = await browser.tabs
            .query({})
            .then((tabs) => tabs.filter((tab) => tab.url?.startsWith(url)));

        if (allTabs.length > 0) {
            return browser.tabs.update(allTabs[0].id, { active: true });
        }
    })();

    if (existingTab?.windowId) {
        browser.windows.update(existingTab.windowId, { focused: true });
    }

    return browser.tabs.create({ url });
};

export const dateFormatter = new Intl.DateTimeFormat(DEFAULT_SETTINGS.locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
}); // TODO: Load locale from settings

/**
 * Convert unix timestamp to human readable diff date
 * @param timestamp
 */
export const diffDate = (
    timestamp: number,
    currentTimestamp?: number,
): string => {
    const now = currentTimestamp || Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    let interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        // >= 1 hour ago
        // Render whole date
        return dateFormatter.format(new Date(timestamp));
    }

    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        // >= 1 minute ago
        return `${interval} minutes ago`;
    }

    return `${Math.floor(seconds)} seconds ago`;
};
