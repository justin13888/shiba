// Implement Onetab-related functionality

import { nanoid } from "nanoid";
import { Tab, type TabBundle, TabGroup } from "../types/model";
import { getAllTabGroups, getAllTabs, getTabsById } from "./db";
import { Logger } from "./logger";

const logger = new Logger(import.meta.url);

const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// TODO: Develop unit tests
/**
 * Parse OneTab export string into tab groups
 * @param input OneTab input string
 * @returns TabBundle[] representing tab groups
 */
export const parseOneTabUrl = (input: string): TabBundle[] => {
    logger.debug("Parsing OneTab input:", input);

    const lines = input.split("\n");
    const groups: TabBundle[] = [];
    const currentTime = Date.now();
    let i = 0;
    let currentGroup: TabGroup = new TabGroup({
        timeCreated: currentTime,
    });
    let currentTabs: Tab[] = [];
    let order = 0;

    let lineCount = 0;
    for (const line of lines) {
        lineCount++;
        // If empty line, move to next tab group
        const l = line.trim();
        if (l === "") {
            if (currentTabs.length > 0) {
                groups.push([currentGroup, currentTabs]);
                i++;
                currentGroup = new TabGroup({
                    timeCreated: currentTime - i,
                });
                currentTabs = [];
            }
        } else {
            // Line should be of format: "url | title"
            // Note: title can contain "|"
            // Parse and handle unexpected formats
            const [first, ...rest] = l.split("|");
            const [trimmedUrl, trimmedTitle] = [
                first.trim(),
                rest.join("|").trim(),
            ];

            // Check url is valid with regex
            if (!isValidUrl(trimmedUrl)) {
                throw new Error(
                    `Invalid URL at line ${lineCount}: ${trimmedUrl}`,
                );
            }

            // Create tab object
            const tab: Tab = {
                id: nanoid(),
                groupId: currentGroup.id,
                order,
                title: trimmedTitle,
                url: trimmedUrl,
            };
            order++;
            currentTabs.push(tab);
        }
    }

    if (currentTabs.length > 0) {
        groups.push([currentGroup, currentTabs]);
    }

    return groups;
};

export namespace BetterOneTab {
    export interface Tab {
        favIconUrl?: string;
        muted?: boolean;
        pinned?: boolean;
        title: string;
        url: string;
    }

    export interface TabGroup {
        tabs: Tab[];
        title: string;
        /** Time created in UNIX millisecond timestamp */
        time: number;
    }
}

const imageExtensions = [
    ".png",
    ".jpeg",
    ".jpg",
    ".gif",
    ".svg",
    ".ico",
    ".webp",
];
const isImageUrl = (url: string): boolean => {
    const urlObj = new URL(url);
    return imageExtensions.some((ext) => urlObj.pathname.endsWith(ext));
};
const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|svg\+xml);base64,.+/;

// TODO: Unit test
// TODO: Fix edge cases
/**
 * Converts favicon URL to data encoded URL
 * @param favIconUrl Favicon URL (image or data encoded URL)
 * @returns Favicon data encoded URL
 */
export const faviconFromString = async (favIconUrl?: string) => {
    if (!favIconUrl) {
        return undefined;
    }

    if (isImageUrl(favIconUrl)) {
        return favIconUrl;
        // try {
        //     // TODO: Fix this because it's not working
        //     // Get image data
        //     const response = await fetch(favIconUrl);
        //     if (!response.ok) {
        //         console.warn(
        //             `Failed to fetch image: ${favIconUrl}`,
        //         );
        //         return undefined;
        //     }

        //     const contentType =
        //         response.headers.get("content-type");

        //     if (!contentType) {
        //         throw new Error(
        //             "Failed to get content type",
        //         );
        //     }

        //     if (contentType.startsWith("image/png")) {
        //         logger.debug("Processing PNG image");
        //         const blob = await response.blob();
        //         // Here you can further process the PNG blob, e.g., creating an object URL for display
        //         logger.debug(
        //             "PNG image fetched successfully",
        //         );
        //     } else if (
        //         contentType.startsWith("image/svg+xml")
        //     ) {
        //         logger.debug("Processing SVG image");
        //         const text = await response.text();
        //         // Here you can further process the SVG text, e.g., displaying it directly in the DOM
        //         logger.debug(
        //             "SVG image fetched successfully",
        //         );
        //     } else {
        //         throw new Error(
        //             `Unsupported content type: ${contentType}`,
        //         );
        //     }
        // } catch (error) {
        //     console.error(
        //         `Error parsing "${favIconUrl}": ${error instanceof Error ? error.message : error}`,
        //     );
        //     return undefined;
        // }
    } else if (dataUrlRegex.test(favIconUrl)) {
        return favIconUrl;
    } else {
        return undefined;
    }
};

// TODO: Develop unit tests
/**
 * Parse Better OneTab export string into tab groups
 * @param input Input string from Better OneTab
 * @returns TabBundle[] representing tab groups
 */
export const parseBetterOneTabUrl = async (
    input: string,
): Promise<TabBundle[]> => {
    logger.debug("Parsing Better OneTab input:", input);

    const parsedJSON = JSON.parse(input) as BetterOneTab.TabGroup[];

    logger.debug("Parsed Better OneTab JSON:", parsedJSON);

    return Promise.all(
        parsedJSON.map(async (group) => {
            const tabGroup = new TabGroup({
                timeCreated: group.time,
            });

            const tabs = await Promise.all(
                group.tabs.map(async (tab, index) => {
                    const favicon = await faviconFromString(tab.favIconUrl);

                    return new Tab({
                        groupId: tabGroup.id,
                        order: index,
                        favicon,
                        title: tab.title,
                        url: tab.url,
                    });
                }),
            );

            return [tabGroup, tabs];
        }),
    );
};

export interface ShibaExport {
    tabs: Tab[];
    tabGroups: TabGroup[];
}

/**
 * @returns Export tabs in Shiba format
 */
export const exportTabBundles = async (): Promise<string> => {
    const shibaExport: ShibaExport = {
        tabs: await getAllTabs(),
        tabGroups: await getAllTabGroups(),
    };
    return JSON.stringify(shibaExport);
};

/**
 * @returns Export tabs in OneTab format
 */
export const exportTabBundlesOneTab = async (): Promise<string> => {
    let output = "";
    const tabGroups = await getAllTabGroups();
    for (const tabGroup of tabGroups) {
        const tabs = await getTabsById(tabGroup.id);
        for (const tab of tabs) {
            output += `${tab.url} | ${tab.title}\n`;
        }
        output += "\n";
    }

    return output;
};
