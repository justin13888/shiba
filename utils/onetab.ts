// Implement Onetab-related functionality

import { nanoid } from "nanoid";
import { Tab, TabGroup } from "../types/model";

const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

// TODO: Develop unit tests
export const parseOneTabUrl = (output: string): TabGroup[] => {
    const lines = output.split('\n');
    const groups: TabGroup[] = [];
    var currentGroup: TabGroup = new TabGroup();

    var lineCount = 0;
    for (const line of lines) {
        lineCount++;
        // If empty line, move to next tab group
        const l = line.trim();
        if (l === '') {
            if (!currentGroup.empty()) {
                groups.push(currentGroup);
            }
            currentGroup = new TabGroup();
            continue;
        } else {
            // Line should be of format: "url | title"
            // Note: title can contain "|"
            // Parse and handle unexpected formats
            const [first, ...rest] = l.split('|');
            const [trimmedUrl, trimmedTitle] = [first.trim(), rest.join('|').trim()];
            
            // Check url is valid with regex
            if (!isValidUrl(trimmedUrl)) {
                throw new Error(`Invalid URL at line ${lineCount}: ${trimmedUrl}`);
            }

            // Create tab object
            const tab = {
                id: nanoid(),
                title: trimmedTitle,
                url: trimmedUrl
            };
            currentGroup.tabs.push(tab);
        }
    }

    if (!currentGroup.empty()) {
        groups.push(currentGroup);
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

const imageExtensions = ['.png', '.jpeg', '.jpg', '.gif', '.svg'];
const isImageUrl = (url: string): boolean => {
  const urlObj = new URL(url);
  return imageExtensions.some(ext => urlObj.pathname.endsWith(ext));
};

// TODO: Develop unit tests
export const parseBetterOneTabUrl = async (output: string): Promise<TabGroup[]> => {
    const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|svg\+xml);base64,.+/;
    const parsedJSON = JSON.parse(output) as BetterOneTab.TabGroup[];

    return Promise.all(parsedJSON.map(async (group) => {
        return new TabGroup({
            tabs: await Promise.all(group.tabs.map(async (tab) => {
                const favicon = await (async (favIconUrl?: string) => {
                    if (!favIconUrl) {
                        return undefined;
                    }

                    if (isImageUrl(favIconUrl)) {
                        try {
                            // Get image data
                            const response = await fetch(favIconUrl);
                            if (!response.ok) {
                                console.warn(`Failed to fetch image: ${favIconUrl}`);
                                return undefined;
                            }

                            const contentType = response.headers.get('content-type');
            
                            if (!contentType) {
                                throw new Error("Failed to get content type");
                            }

                            if (contentType.startsWith('image/png')) {
                                console.log('Processing PNG image');
                                const blob = await response.blob();
                                // Here you can further process the PNG blob, e.g., creating an object URL for display
                                console.log('PNG image fetched successfully');
                            } else if (contentType.startsWith('image/svg+xml')) {
                                console.log('Processing SVG image');
                                const text = await response.text();
                                // Here you can further process the SVG text, e.g., displaying it directly in the DOM
                                console.log('SVG image fetched successfully');
                            } else {
                                throw new Error(`Unsupported content type: ${contentType}`);
                            }
                        } catch (error) {
                            console.error(`Error parsing "${favIconUrl}": ${error instanceof Error ? error.message : error}`);
                        }
                    } else if (dataUrlRegex.test(favIconUrl)) {
                        return favIconUrl;
                    } else {
                        return undefined;
                    }
                
                })(tab.favIconUrl);

                return new Tab({
                    favicon,
                    title: tab.title,
                    url: tab.url,
                })
            })),
            timeCreated: group.time,
        })
    }));
};
