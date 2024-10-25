import { nanoid } from "nanoid";

export interface TabOptions {
    id?: string;
    groupId: string;
    order: number;
    favicon?: string;
    title: string;
    url: string;
    notes?: string;
}

export class Tab {
    /** Unique id */
    id: string;
    /** Group ID */
    groupId: string;
    /** Order */
    order: number;

    /** Favicon image (URL or data encoded URL) */
    favicon?: string;
    /** Title of the tab */
    title: string;
    /** URL of the tab */
    url: string;
    /** Notes */
    notes?: string;

    constructor({
        id,
        groupId,
        order,
        favicon,
        title,
        url,
        notes,
    }: TabOptions) {
        this.id = id || nanoid();
        this.groupId = groupId;
        this.order = order;
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
    categories?: string[];
}

export class TabGroup {
    /** Unique ID */
    id: string;

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
     * Categories by ID
     */
    categories: string[];

    constructor({
        groupId,
        name,
        timeCreated,
        timeModified,
        categories,
    }: TabGroupOptions = {}) {
        this.id = groupId || nanoid();
        this.name = name;
        this.timeCreated = timeCreated || Date.now();
        this.timeModified = timeModified || this.timeCreated;
        this.categories = categories || [];
    }
}

export type TabBundle = [TabGroup, Tab[]];
