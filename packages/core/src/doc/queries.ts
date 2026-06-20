import type {
    DocSnapshot,
    Folder,
    FracIndex,
    Group,
    Id,
    Tab,
    Tag,
    Workspace,
} from "../model";
import { byOrder } from "../ordering/fractional-index";
import { collectLive } from "./internal";

/**
 * Pure selectors over a {@link DocSnapshot}. Each filters out soft-deleted
 * records and returns siblings sorted by `(order, id)`, pinned-first where it
 * applies. These are the only place the UI reads document structure.
 */

function pinnedFirst<T extends { pinned: boolean; order: FracIndex; id: Id }>(
    a: T,
    b: T,
): number {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return byOrder(a, b);
}

export function liveWorkspaces(snap: DocSnapshot): Workspace[] {
    return collectLive(Object.values(snap.workspaces), () => true);
}

export function defaultWorkspace(snap: DocSnapshot): Workspace | undefined {
    const live = liveWorkspaces(snap);
    return live.find((w) => w.isDefault) ?? live[0];
}

export function liveFolders(
    snap: DocSnapshot,
    workspaceId: Id,
    parentId: Id | null,
): Folder[] {
    return collectLive(
        Object.values(snap.folders),
        (f) => f.workspaceId === workspaceId && f.parentId === parentId,
    );
}

export function liveGroups(
    snap: DocSnapshot,
    workspaceId: Id,
    parentId: Id | null,
): Group[] {
    return Object.values(snap.groups)
        .filter(
            (g) =>
                g.deletedAt === null &&
                g.archivedAt === null &&
                g.workspaceId === workspaceId &&
                g.parentId === parentId,
        )
        .sort(pinnedFirst);
}

export function liveTabs(snap: DocSnapshot, groupId: Id): Tab[] {
    return Object.values(snap.tabs)
        .filter((t) => t.deletedAt === null && t.groupId === groupId)
        .sort(pinnedFirst);
}

export function liveTags(snap: DocSnapshot): Tag[] {
    return Object.values(snap.tags)
        .filter((t) => t.deletedAt === null)
        .sort((a, b) => a.name.localeCompare(b.name));
}

export function archivedGroups(snap: DocSnapshot, workspaceId: Id): Group[] {
    return Object.values(snap.groups)
        .filter(
            (g) =>
                g.deletedAt === null &&
                g.archivedAt !== null &&
                g.workspaceId === workspaceId,
        )
        .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
}

export function tabsByTag(snap: DocSnapshot, tagId: Id): Tab[] {
    return Object.values(snap.tabs)
        .filter((t) => t.deletedAt === null && t.tagIds.includes(tagId))
        .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function groupTabCount(snap: DocSnapshot, groupId: Id): number {
    let count = 0;
    for (const t of Object.values(snap.tabs)) {
        if (t.deletedAt === null && t.groupId === groupId) count++;
    }
    return count;
}

export interface TrashContents {
    workspaces: Workspace[];
    folders: Folder[];
    groups: Group[];
    tabs: Tab[];
}

export function trashed(snap: DocSnapshot): TrashContents {
    return {
        workspaces: Object.values(snap.workspaces).filter(
            (w) => w.deletedAt !== null,
        ),
        folders: Object.values(snap.folders).filter(
            (f) => f.deletedAt !== null,
        ),
        groups: Object.values(snap.groups).filter((g) => g.deletedAt !== null),
        tabs: Object.values(snap.tabs).filter((t) => t.deletedAt !== null),
    };
}
