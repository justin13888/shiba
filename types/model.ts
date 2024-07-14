import { nanoid } from "nanoid";

export interface TabOptions {
    id?: string;
    favicon?: string;
    title: string;
    url: string;
};

export class Tab {
    /** Unique id */
    id: string;
    /** Favicon image data URL encoded */
    favicon?: string;
    title: string;
    url: string;

    constructor({ id, favicon, title, url }: TabOptions) {
        this.id = id || nanoid();
        this.favicon = favicon;
        this.title = title;
        this.url = url;
    }
}

export interface TabGroupOptions {
    groupId?: string;
    tabs?: Tab[];
    timeCreated?: number;
}

export class TabGroup {
    groupId: string;
    tabs: Tab[];
    /**
     * Time created in milliseconds since epoch
     */
    timeCreated: number;
    
    constructor({ groupId, tabs, timeCreated }: TabGroupOptions = {}) {
        this.groupId = groupId || nanoid();
        this.tabs = tabs || [];
        this.timeCreated = timeCreated || Date.now();
    }

    empty(): boolean {
        return this.tabs.length === 0;
    }
}
