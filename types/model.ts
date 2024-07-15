import { nanoid } from "nanoid";

export interface TabOptions {
    id?: string;
    favicon?: string;
    title: string;
    url: string;
    tabGroupId: string;
};

export class Tab {
    /** Unique id */
    id: string;
    /** Favicon image data URL encoded */
    favicon?: string;
    title: string;
    url: string;
    tabGroupId: string;

    constructor({ id, favicon, title, url, tabGroupId }: TabOptions) {
        this.id = id || nanoid();
        this.favicon = favicon;
        this.title = title;
        this.url = url;
        this.tabGroupId = tabGroupId;
    }
}

export interface TabGroupOptions {
    groupId?: string;
    name?: string;
    timeCreated?: number;
}

export class TabGroup {
    groupId: string;
    name?: string;
    /**
     * Time created in milliseconds since epoch
     */
    timeCreated: number;
    
    constructor({ groupId, name, timeCreated }: TabGroupOptions = {}) {
        this.groupId = groupId || nanoid();
        this.name = name;
        this.timeCreated = timeCreated || Date.now();
    }
}

export type TabBundle = [TabGroup, Tab[]];
