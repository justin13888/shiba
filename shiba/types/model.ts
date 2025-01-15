import { nanoid } from "nanoid";
import type { JSX } from "solid-js";

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
    id?: string;
    workspaceId?: string;
    name?: string;
    timeCreated?: number;
    timeModified?: number;
    categories?: string[];
}

export class TabGroup {
    /** Unique ID */
    id: string;
    /** Workspace ID. Undefined indicates default */
    workspaceId?: string;

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
        id,
        workspaceId,
        name,
        timeCreated,
        timeModified,
        categories,
    }: TabGroupOptions = {}) {
        this.id = id || nanoid();
        this.workspaceId = workspaceId;
        this.name = name;
        this.timeCreated = timeCreated || Date.now();
        this.timeModified = timeModified || this.timeCreated; // TODO: make sure any function updating this also updates timeModified
        this.categories = categories || [];
    }
}

export type TabBundle = [TabGroup, Tab[]];

export interface WorkspaceOptions {
    id?: string;
    order: number;
    name: string;
    icon?: () => JSX.Element;
}

export class Workspace {
    /** Unique ID */
    id: string;
    /** Order */
    order: number;

    /** Name of the workspace */
    name: string;
    /** JSX Icon */
    icon?: () => JSX.Element;

    constructor({ id, order, name, icon }: WorkspaceOptions) {
        this.id = id || nanoid();
        this.order = order;
        this.name = name;
        this.icon = icon;
    }
}
