import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import type { Tabs } from "webextension-polyfill";
/**
 * Switch to or open tab
 * @param url
 */
export const switchToOrOpenTab = async (url: string): Promise<Tabs.Tab> => {
    const tabs = await browser.tabs.query({ currentWindow: true, url });

    if (tabs.length > 0) {
        return browser.tabs.update(tabs[0].id, { active: true });
    }

    return browser.tabs.create({ url });
};
