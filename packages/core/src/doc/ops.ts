import { hostnameOf } from "../internal/url";
import type {
    EntityRef,
    Folder,
    FracIndex,
    Group,
    Id,
    Millis,
    Soft,
    Tab,
    Tag,
    Workspace,
} from "../model";
import { keyBetween } from "../ordering/fractional-index";
import type { AnalyticsSink } from "../ports/analytics-sink";
import type { Clock, IdGen } from "../ports/clock";
import type { DocTx, RecordMap } from "../ports/crdt";
import type { BrowserTab } from "../ports/tabs";
import { collectLive, placeAmong, recordsOf } from "./internal";

/** Side-effect dependencies injected into every mutating operation. */
export interface OpDeps {
    clock: Clock;
    ids: IdGen;
    analytics?: AnalyticsSink;
}

export type GroupingStrategy = "single" | "byWindow" | "byDomain";

export interface NewWorkspace {
    name: string;
    iconName?: string;
    color?: string;
}
export interface NewFolder {
    workspaceId: Id;
    parentId?: Id | null;
    name: string;
    color?: string;
}
export interface NewGroup {
    workspaceId: Id;
    parentId?: Id | null;
    name?: string;
    color?: string;
}
export interface NewTab {
    groupId: Id;
    url: string;
    title: string;
    favicon?: string;
    notes?: string;
}
export interface NewTag {
    name: string;
    color?: string;
}

export interface SaveTabsOptions {
    workspaceId: Id;
    parentId?: Id | null;
    strategy?: GroupingStrategy;
    name?: string;
}
export interface SaveResult {
    groupIds: Id[];
    tabIds: Id[];
}

/** Where to drop a moved item among its new siblings. */
export interface Position {
    before?: Id | null;
    after?: Id | null;
}

// --- creation -------------------------------------------------------------
export function createWorkspace(
    tx: DocTx,
    deps: OpDeps,
    input: NewWorkspace,
): Workspace {
    const now = deps.clock.now();
    const siblings = collectLive(recordsOf(tx.workspaces), () => true);
    const ws: Workspace = {
        id: deps.ids.next(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        name: input.name,
        iconName: input.iconName,
        color: input.color,
        order: placeAmong(siblings),
        isDefault: false,
    };
    tx.workspaces.set(ws.id, ws);
    return ws;
}

export function createFolder(
    tx: DocTx,
    deps: OpDeps,
    input: NewFolder,
): Folder {
    const now = deps.clock.now();
    const parentId = input.parentId ?? null;
    const siblings = collectLive(
        recordsOf(tx.folders),
        (f) => f.workspaceId === input.workspaceId && f.parentId === parentId,
    );
    const folder: Folder = {
        id: deps.ids.next(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        workspaceId: input.workspaceId,
        parentId,
        name: input.name,
        color: input.color,
        order: placeAmong(siblings),
    };
    tx.folders.set(folder.id, folder);
    return folder;
}

export function createGroup(tx: DocTx, deps: OpDeps, input: NewGroup): Group {
    const now = deps.clock.now();
    const parentId = input.parentId ?? null;
    const siblings = collectLive(
        recordsOf(tx.groups),
        (g) => g.workspaceId === input.workspaceId && g.parentId === parentId,
    );
    const group: Group = {
        id: deps.ids.next(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        workspaceId: input.workspaceId,
        parentId,
        name: input.name,
        color: input.color,
        order: placeAmong(siblings),
        pinned: false,
        locked: false,
        archivedAt: null,
        savedAt: now,
    };
    tx.groups.set(group.id, group);
    deps.analytics?.record({ type: "group_created", at: now });
    return group;
}

export function createTab(tx: DocTx, deps: OpDeps, input: NewTab): Tab {
    const now = deps.clock.now();
    const siblings = collectLive(
        recordsOf(tx.tabs),
        (t) => t.groupId === input.groupId,
    );
    const tab: Tab = {
        id: deps.ids.next(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        groupId: input.groupId,
        order: placeAmong(siblings),
        url: input.url,
        title: input.title,
        favicon: input.favicon,
        notes: input.notes,
        tagIds: [],
        pinned: false,
        addedAt: now,
        openCount: 0,
    };
    tx.tabs.set(tab.id, tab);
    return tab;
}

export function createTag(tx: DocTx, deps: OpDeps, input: NewTag): Tag {
    const now = deps.clock.now();
    const tag: Tag = {
        id: deps.ids.next(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        name: input.name,
        color: input.color,
    };
    tx.tags.set(tag.id, tag);
    return tag;
}

interface Bucket {
    name?: string;
    tabs: BrowserTab[];
}

function planBuckets(
    tabs: BrowserTab[],
    strategy: GroupingStrategy,
    now: Millis,
    name?: string,
): Bucket[] {
    if (tabs.length === 0) return [];
    if (strategy === "byWindow") {
        const byWindow = new Map<number, BrowserTab[]>();
        for (const tab of tabs) {
            const key = tab.windowId ?? 0;
            const list = byWindow.get(key) ?? [];
            list.push(tab);
            byWindow.set(key, list);
        }
        return [...byWindow.values()].map((group, i) => ({
            name: `Window ${i + 1}`,
            tabs: group,
        }));
    }
    if (strategy === "byDomain") {
        const byDomain = new Map<string, BrowserTab[]>();
        for (const tab of tabs) {
            const key = hostnameOf(tab.url);
            const list = byDomain.get(key) ?? [];
            list.push(tab);
            byDomain.set(key, list);
        }
        return [...byDomain.entries()].map(([domain, group]) => ({
            name: domain,
            tabs: group,
        }));
    }
    return [{ name: name ?? new Date(now).toISOString().slice(0, 10), tabs }];
}

/** Save captured browser tabs into one or more new groups per {@link GroupingStrategy}. */
export function saveBrowserTabs(
    tx: DocTx,
    deps: OpDeps,
    tabs: BrowserTab[],
    options: SaveTabsOptions,
): SaveResult {
    const now = deps.clock.now();
    const buckets = planBuckets(
        tabs,
        options.strategy ?? "single",
        now,
        options.name,
    );
    const groupIds: Id[] = [];
    const tabIds: Id[] = [];

    for (const bucket of buckets) {
        const group = createGroup(tx, deps, {
            workspaceId: options.workspaceId,
            parentId: options.parentId ?? null,
            name: bucket.name,
        });
        groupIds.push(group.id);

        let prev: FracIndex | null = null;
        for (const bt of bucket.tabs) {
            const order = keyBetween(prev, null);
            const tab: Tab = {
                id: deps.ids.next(),
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                groupId: group.id,
                order,
                url: bt.url,
                title: bt.title,
                favicon: bt.favIconUrl,
                tagIds: [],
                pinned: false,
                addedAt: now,
                openCount: 0,
            };
            tx.tabs.set(tab.id, tab);
            tabIds.push(tab.id);
            prev = order;
        }
    }

    deps.analytics?.record({
        type: "tab_saved",
        at: now,
        count: tabIds.length,
    });
    return { groupIds, tabIds };
}

// --- mutation -------------------------------------------------------------
export function rename(
    tx: DocTx,
    deps: OpDeps,
    ref: EntityRef,
    name: string,
): void {
    const updatedAt = deps.clock.now();
    switch (ref.kind) {
        case "workspace":
            tx.workspaces.patch(ref.id, { name, updatedAt });
            return;
        case "folder":
            tx.folders.patch(ref.id, { name, updatedAt });
            return;
        case "group":
            tx.groups.patch(ref.id, { name, updatedAt });
            return;
        case "tag":
            tx.tags.patch(ref.id, { name, updatedAt });
            return;
        case "tab":
            tx.tabs.patch(ref.id, { title: name, updatedAt });
            return;
    }
}

export function setNotes(
    tx: DocTx,
    deps: OpDeps,
    tabId: Id,
    notes: string,
): void {
    tx.tabs.patch(tabId, { notes, updatedAt: deps.clock.now() });
}

/** Pin/unpin a tab or group (pinned items sort first in their container). */
export function setPinned(
    tx: DocTx,
    deps: OpDeps,
    ref: EntityRef,
    pinned: boolean,
): void {
    const updatedAt = deps.clock.now();
    if (ref.kind === "tab") tx.tabs.patch(ref.id, { pinned, updatedAt });
    else if (ref.kind === "group")
        tx.groups.patch(ref.id, { pinned, updatedAt });
}

export function setLocked(
    tx: DocTx,
    deps: OpDeps,
    groupId: Id,
    locked: boolean,
): void {
    tx.groups.patch(groupId, { locked, updatedAt: deps.clock.now() });
}

export function setArchived(
    tx: DocTx,
    deps: OpDeps,
    groupId: Id,
    archived: boolean,
): void {
    const now = deps.clock.now();
    tx.groups.patch(groupId, {
        archivedAt: archived ? now : null,
        updatedAt: now,
    });
}

export function setTag(
    tx: DocTx,
    deps: OpDeps,
    tabId: Id,
    tagId: Id,
    on: boolean,
): void {
    const tab = tx.tabs.get(tabId);
    if (!tab) return;
    if (on === tab.tagIds.includes(tagId)) return;
    const tagIds = on
        ? [...tab.tagIds, tagId]
        : tab.tagIds.filter((id) => id !== tagId);
    tx.tabs.patch(tabId, { tagIds, updatedAt: deps.clock.now() });
}

// --- movement (reorder + reparent are the same field write) ---------------
export function moveTab(
    tx: DocTx,
    deps: OpDeps,
    tabId: Id,
    dest: { groupId: Id } & Position,
): void {
    if (!tx.tabs.has(tabId)) return;
    const siblings = collectLive(
        recordsOf(tx.tabs),
        (t) => t.groupId === dest.groupId && t.id !== tabId,
    );
    tx.tabs.patch(tabId, {
        groupId: dest.groupId,
        order: placeAmong(siblings, dest),
        updatedAt: deps.clock.now(),
    });
}

export function moveGroup(
    tx: DocTx,
    deps: OpDeps,
    groupId: Id,
    dest: { workspaceId: Id; parentId: Id | null } & Position,
): void {
    if (!tx.groups.has(groupId)) return;
    const siblings = collectLive(
        recordsOf(tx.groups),
        (g) =>
            g.workspaceId === dest.workspaceId &&
            g.parentId === dest.parentId &&
            g.id !== groupId,
    );
    tx.groups.patch(groupId, {
        workspaceId: dest.workspaceId,
        parentId: dest.parentId,
        order: placeAmong(siblings, dest),
        updatedAt: deps.clock.now(),
    });
}

export function moveFolder(
    tx: DocTx,
    deps: OpDeps,
    folderId: Id,
    dest: { workspaceId: Id; parentId: Id | null } & Position,
): void {
    if (!tx.folders.has(folderId)) return;
    // Reject moves that would create a cycle (into self or a descendant).
    if (
        dest.parentId !== null &&
        isSelfOrDescendant(tx, folderId, dest.parentId)
    )
        return;
    const siblings = collectLive(
        recordsOf(tx.folders),
        (f) =>
            f.workspaceId === dest.workspaceId &&
            f.parentId === dest.parentId &&
            f.id !== folderId,
    );
    tx.folders.patch(folderId, {
        workspaceId: dest.workspaceId,
        parentId: dest.parentId,
        order: placeAmong(siblings, dest),
        updatedAt: deps.clock.now(),
    });
}

function isSelfOrDescendant(tx: DocTx, folderId: Id, candidate: Id): boolean {
    let cursor: Id | null = candidate;
    const seen = new Set<Id>();
    while (cursor !== null) {
        if (cursor === folderId) return true;
        if (seen.has(cursor)) return false;
        seen.add(cursor);
        cursor = tx.folders.get(cursor)?.parentId ?? null;
    }
    return false;
}

// --- lifecycle (soft delete cascades; restore reverses the subtree) -------
function setDeleted<T extends Soft & { id: Id }>(
    map: RecordMap<T>,
    id: Id,
    deletedAt: Millis | null,
    now: Millis,
): void {
    map.patch(id, { deletedAt, updatedAt: now } as Partial<T>);
}

export function softDelete(tx: DocTx, deps: OpDeps, ref: EntityRef): void {
    const now = deps.clock.now();
    switch (ref.kind) {
        case "tab":
            setDeleted(tx.tabs, ref.id, now, now);
            return;
        case "tag":
            setDeleted(tx.tags, ref.id, now, now);
            return;
        case "group":
            deleteGroupSubtree(tx, ref.id, now);
            deps.analytics?.record({ type: "group_deleted", at: now });
            return;
        case "folder":
            deleteFolderSubtree(tx, ref.id, now);
            return;
        case "workspace": {
            setDeleted(tx.workspaces, ref.id, now, now);
            for (const f of recordsOf(tx.folders))
                if (f?.workspaceId === ref.id)
                    setDeleted(tx.folders, f.id, now, now);
            for (const g of recordsOf(tx.groups))
                if (g?.workspaceId === ref.id)
                    deleteGroupSubtree(tx, g.id, now);
            return;
        }
    }
}

function deleteGroupSubtree(tx: DocTx, groupId: Id, now: Millis): void {
    setDeleted(tx.groups, groupId, now, now);
    for (const t of recordsOf(tx.tabs))
        if (t?.groupId === groupId) setDeleted(tx.tabs, t.id, now, now);
}

function deleteFolderSubtree(tx: DocTx, folderId: Id, now: Millis): void {
    setDeleted(tx.folders, folderId, now, now);
    for (const f of recordsOf(tx.folders))
        if (f?.parentId === folderId) deleteFolderSubtree(tx, f.id, now);
    for (const g of recordsOf(tx.groups))
        if (g?.parentId === folderId) deleteGroupSubtree(tx, g.id, now);
}

export function restore(tx: DocTx, deps: OpDeps, ref: EntityRef): void {
    const now = deps.clock.now();
    switch (ref.kind) {
        case "tab":
            setDeleted(tx.tabs, ref.id, null, now);
            return;
        case "tag":
            setDeleted(tx.tags, ref.id, null, now);
            return;
        case "group":
            restoreGroupSubtree(tx, ref.id, now);
            return;
        case "folder":
            restoreFolderSubtree(tx, ref.id, now);
            return;
        case "workspace": {
            setDeleted(tx.workspaces, ref.id, null, now);
            for (const f of recordsOf(tx.folders))
                if (f?.workspaceId === ref.id)
                    setDeleted(tx.folders, f.id, null, now);
            for (const g of recordsOf(tx.groups))
                if (g?.workspaceId === ref.id)
                    restoreGroupSubtree(tx, g.id, now);
            return;
        }
    }
}

function restoreGroupSubtree(tx: DocTx, groupId: Id, now: Millis): void {
    setDeleted(tx.groups, groupId, null, now);
    for (const t of recordsOf(tx.tabs))
        if (t?.groupId === groupId) setDeleted(tx.tabs, t.id, null, now);
}

function restoreFolderSubtree(tx: DocTx, folderId: Id, now: Millis): void {
    setDeleted(tx.folders, folderId, null, now);
    for (const f of recordsOf(tx.folders))
        if (f?.parentId === folderId) restoreFolderSubtree(tx, f.id, now);
    for (const g of recordsOf(tx.groups))
        if (g?.parentId === folderId) restoreGroupSubtree(tx, g.id, now);
}
