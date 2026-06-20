import type { Id } from "./common";
import type { Folder } from "./folder";
import type { Group } from "./group";
import type { Tab } from "./tab";
import type { Tag } from "./tag";
import type { Workspace } from "./workspace";

export * from "./common";
export * from "./folder";
export * from "./group";
export * from "./tab";
export * from "./tag";
export * from "./workspace";

/**
 * A plain, immutable read-model of the whole document at a point in time. The
 * reactive UI store renders from this; pure selectors in `doc/queries` operate
 * on it. Records are keyed by id within each collection.
 */
export interface DocSnapshot {
    schemaVersion: number;
    workspaces: Readonly<Record<Id, Workspace>>;
    folders: Readonly<Record<Id, Folder>>;
    groups: Readonly<Record<Id, Group>>;
    tabs: Readonly<Record<Id, Tab>>;
    tags: Readonly<Record<Id, Tag>>;
}

/** The mutable record collections, named consistently across snapshot and tx. */
export type DocCollection =
    | "workspaces"
    | "folders"
    | "groups"
    | "tabs"
    | "tags";

export const DOC_COLLECTIONS: readonly DocCollection[] = [
    "workspaces",
    "folders",
    "groups",
    "tabs",
    "tags",
];
