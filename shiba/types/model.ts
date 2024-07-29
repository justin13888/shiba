import { nanoid } from "nanoid";

export interface TabOptions {
    id?: string;
    favicon?: string;
    title: string;
    url: string;
    notes?: string;
}

export class Tab {
    /** Unique id */
    id: string;
    /** Favicon image (URL or data encoded URL) */
    favicon?: string;
    /** Title of the tab */
    title: string;
    /** URL of the tab */
    url: string;
    /** Notes */
    notes?: string;

    constructor({ id, favicon, title, url, notes }: TabOptions) {
        this.id = id || nanoid();
        this.favicon = favicon;
        this.title = title;
        this.url = url;
        this.notes = notes;
    }
}

export interface TabGroupOptions {
    groupId?: string;
    name?: string;
    timeCreated?: number;
    timeModified?: number;
    tabs?: string[];
    categories?: string[];
}

export class TabGroup {
    /** Unique group ID */
    groupId: string;

    /** Name of the group */
    name?: string;

    /**
     * Time created in milliseconds since epoch
     */
    timeCreated: number;

    /**
     * Time last modified in milliseconds since epoch
     */
    timeModified: number;

    /**
     * Tabs in the group by ID
     */
    tabs: string[];

    /**
     * Categories by ID
     */
    categories: string[];

    constructor({
        groupId,
        name,
        timeCreated,
        timeModified,
        tabs,
        categories,
    }: TabGroupOptions = {}) {
        this.groupId = groupId || nanoid();
        this.name = name;
        this.timeCreated = timeCreated || Date.now();
        this.timeModified = timeModified || this.timeCreated;
        this.tabs = tabs || [];
        this.categories = categories || [];
    }
}

export type TabBundle = [TabGroup, Tab[]];
