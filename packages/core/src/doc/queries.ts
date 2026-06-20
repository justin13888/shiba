import { notImplemented } from "../internal/errors";
import type {
    DocSnapshot,
    Folder,
    Group,
    Id,
    Tab,
    Tag,
    Workspace,
} from "../model";

/**
 * Pure selectors over a {@link DocSnapshot}. Each filters out soft-deleted
 * records and returns siblings sorted by `(order, id)`, pinned-first where it
 * applies. These are the only place the UI reads document structure.
 */

export function liveWorkspaces(_snap: DocSnapshot): Workspace[] {
    return notImplemented("queries.liveWorkspaces");
}
export function defaultWorkspace(_snap: DocSnapshot): Workspace | undefined {
    return notImplemented("queries.defaultWorkspace");
}
export function liveFolders(
    _snap: DocSnapshot,
    _workspaceId: Id,
    _parentId: Id | null,
): Folder[] {
    return notImplemented("queries.liveFolders");
}
export function liveGroups(
    _snap: DocSnapshot,
    _workspaceId: Id,
    _parentId: Id | null,
): Group[] {
    return notImplemented("queries.liveGroups");
}
export function liveTabs(_snap: DocSnapshot, _groupId: Id): Tab[] {
    return notImplemented("queries.liveTabs");
}
export function liveTags(_snap: DocSnapshot): Tag[] {
    return notImplemented("queries.liveTags");
}
export function archivedGroups(_snap: DocSnapshot, _workspaceId: Id): Group[] {
    return notImplemented("queries.archivedGroups");
}
export function tabsByTag(_snap: DocSnapshot, _tagId: Id): Tab[] {
    return notImplemented("queries.tabsByTag");
}
export function groupTabCount(_snap: DocSnapshot, _groupId: Id): number {
    return notImplemented("queries.groupTabCount");
}

export interface TrashContents {
    workspaces: Workspace[];
    folders: Folder[];
    groups: Group[];
    tabs: Tab[];
}
export function trashed(_snap: DocSnapshot): TrashContents {
    return notImplemented("queries.trashed");
}
