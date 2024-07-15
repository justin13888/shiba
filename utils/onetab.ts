// Implement Onetab-related functionality

import { nanoid } from "nanoid";
import { Tab, type TabBundle, TabGroup } from "../types/model";

const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

// TODO: Develop unit tests
export const parseOneTabUrl = (output: string): TabBundle[] => {
    console.log('Parsing OneTab output:', output);

    const lines = output.split('\n');
    const groups: TabBundle[] = [];
    let currentGroup: TabGroup = new TabGroup();
    let currentTabs: Tab[] = [];

    let lineCount = 0;
    for (const line of lines) {
        lineCount++;
        // If empty line, move to next tab group
        const l = line.trim();
        if (l === '') {
            if (currentTabs.length > 0) {
                groups.push([currentGroup, currentTabs]);
            }
            currentGroup = new TabGroup();
            currentTabs = [];
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
            const tab: Tab = {
                id: nanoid(),
                title: trimmedTitle,
                url: trimmedUrl,
                tabGroupId: currentGroup.groupId,
            };
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

const imageExtensions = ['.png', '.jpeg', '.jpg', '.gif', '.svg'];
const isImageUrl = (url: string): boolean => {
  const urlObj = new URL(url);
  return imageExtensions.some(ext => urlObj.pathname.endsWith(ext));
};

// TODO: Develop unit tests
export const parseBetterOneTabUrl = async (output: string): Promise<TabBundle[]> => {
    console.log('Parsing Better OneTab output:', output);

    const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|svg\+xml);base64,.+/;
    const parsedJSON = JSON.parse(output) as BetterOneTab.TabGroup[];

    console.log('Parsed Better OneTab JSON:', parsedJSON);

    return Promise.all(parsedJSON.map(async (group) => {
        const tabGroup = new TabGroup({
            timeCreated: group.time,
        });
        const tabs = await Promise.all(group.tabs.map(async (tab) => {
            const favicon = await (async (favIconUrl?: string) => {
                if (!favIconUrl) {
                    return undefined;
                }

                if (isImageUrl(favIconUrl)) {
                    try {
                        // TODO: Fix this because it's not working
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
                        return undefined;                        
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
                tabGroupId: tabGroup.groupId,
            })
        }));

        return [tabGroup, tabs];
    }));
};
