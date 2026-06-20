import type { Folder, Group, Id, Millis, Tab, Tag, Workspace } from "../model";
import { keyBetween, keysBetween } from "../ordering/fractional-index";
import type { IdGen } from "../ports/clock";

/** Shapes of the legacy (v1) IndexedDB records. */
export interface LegacyWorkspace {
    id: string;
    order: number;
    name: string;
}
export interface LegacyTabGroup {
    id: string;
    workspaceId?: string;
    name?: string;
    timeCreated: number;
    timeModified: number;
    categories?: string[];
}
export interface LegacyTab {
    id: string;
    groupId: string;
    order: number;
    favicon?: string;
    title: string;
    url: string;
    notes?: string;
}
export interface LegacyData {
    workspaces: LegacyWorkspace[];
    tabGroups: LegacyTabGroup[];
    tabs: LegacyTab[];
}

export interface MigratedData {
    workspaces: Workspace[];
    folders: Folder[];
    groups: Group[];
    tabs: Tab[];
    tags: Tag[];
}

/** Assign `n` ascending fractional keys (always at least the requested count). */
function keys(n: number): string[] {
    return n > 0 ? keysBetween(null, null, n) : [];
}

/**
 * Convert legacy v1 records (class instances, integer `order`, JSX workspace
 * icons) into the v2 model: fractional ordering, a guaranteed default
 * workspace, dropped unserializable icons, and dropped legacy categories.
 * Ids are preserved so existing references stay valid.
 */
export function migrateV1(
    data: LegacyData,
    deps: { now: Millis; ids: IdGen },
): MigratedData {
    const { now } = deps;

    const sortedWorkspaces = [...data.workspaces].sort(
        (a, b) => a.order - b.order,
    );
    const wsKeys = keys(sortedWorkspaces.length);
    const workspaces: Workspace[] = sortedWorkspaces.map((w, i) => ({
        id: w.id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        name: w.name,
        order: wsKeys[i] ?? keyBetween(null, null),
        isDefault: i === 0,
    }));
    if (workspaces.length === 0) {
        workspaces.push({
            id: deps.ids.next(),
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            name: "Personal",
            order: keyBetween(null, null),
            isDefault: true,
        });
    }
    const defaultWorkspaceId = workspaces[0]?.id ?? deps.ids.next();
    const workspaceIds = new Set(workspaces.map((w) => w.id));

    // Groups, ordered by creation time within each resolved workspace.
    const byWorkspace = new Map<Id, LegacyTabGroup[]>();
    for (const g of data.tabGroups) {
        const wsId =
            g.workspaceId && workspaceIds.has(g.workspaceId)
                ? g.workspaceId
                : defaultWorkspaceId;
        const list = byWorkspace.get(wsId) ?? [];
        list.push(g);
        byWorkspace.set(wsId, list);
    }
    const groups: Group[] = [];
    for (const [wsId, list] of byWorkspace) {
        list.sort((a, b) => a.timeCreated - b.timeCreated);
        const orderKeys = keys(list.length);
        list.forEach((g, i) => {
            groups.push({
                id: g.id,
                createdAt: g.timeCreated,
                updatedAt: g.timeModified,
                deletedAt: null,
                workspaceId: wsId,
                parentId: null,
                name: g.name,
                order: orderKeys[i] ?? keyBetween(null, null),
                pinned: false,
                locked: false,
                archivedAt: null,
                savedAt: g.timeCreated,
            });
        });
    }

    // Tabs, ordered by legacy integer order within each surviving group.
    const groupIds = new Set(groups.map((g) => g.id));
    const byGroup = new Map<Id, LegacyTab[]>();
    for (const t of data.tabs) {
        if (!groupIds.has(t.groupId)) continue;
        const list = byGroup.get(t.groupId) ?? [];
        list.push(t);
        byGroup.set(t.groupId, list);
    }
    const tabs: Tab[] = [];
    for (const [groupId, list] of byGroup) {
        list.sort((a, b) => a.order - b.order);
        const orderKeys = keys(list.length);
        list.forEach((t, i) => {
            tabs.push({
                id: t.id,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                groupId,
                order: orderKeys[i] ?? keyBetween(null, null),
                url: t.url,
                title: t.title,
                favicon: t.favicon,
                notes: t.notes,
                tagIds: [],
                pinned: false,
                addedAt: now,
                openCount: 0,
            });
        });
    }

    return { workspaces, folders: [], groups, tabs, tags: [] };
}
