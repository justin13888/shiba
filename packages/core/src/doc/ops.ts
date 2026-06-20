import { notImplemented } from "../internal/errors";
import type {
    EntityRef,
    Folder,
    Group,
    Id,
    Tab,
    Tag,
    Workspace,
} from "../model";
import type { AnalyticsSink } from "../ports/analytics-sink";
import type { Clock, IdGen } from "../ports/clock";
import type { DocTx } from "../ports/crdt";
import type { BrowserTab } from "../ports/tabs";

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
    _tx: DocTx,
    _deps: OpDeps,
    _input: NewWorkspace,
): Workspace {
    return notImplemented("ops.createWorkspace");
}
export function createFolder(
    _tx: DocTx,
    _deps: OpDeps,
    _input: NewFolder,
): Folder {
    return notImplemented("ops.createFolder");
}
export function createGroup(
    _tx: DocTx,
    _deps: OpDeps,
    _input: NewGroup,
): Group {
    return notImplemented("ops.createGroup");
}
export function createTab(_tx: DocTx, _deps: OpDeps, _input: NewTab): Tab {
    return notImplemented("ops.createTab");
}
export function createTag(_tx: DocTx, _deps: OpDeps, _input: NewTag): Tag {
    return notImplemented("ops.createTag");
}

/** Save captured browser tabs into one or more new groups per {@link GroupingStrategy}. */
export function saveBrowserTabs(
    _tx: DocTx,
    _deps: OpDeps,
    _tabs: BrowserTab[],
    _options: SaveTabsOptions,
): SaveResult {
    return notImplemented("ops.saveBrowserTabs");
}

// --- mutation -------------------------------------------------------------
export function rename(
    _tx: DocTx,
    _deps: OpDeps,
    _ref: EntityRef,
    _name: string,
): void {
    notImplemented("ops.rename");
}
export function setNotes(
    _tx: DocTx,
    _deps: OpDeps,
    _tabId: Id,
    _notes: string,
): void {
    notImplemented("ops.setNotes");
}
/** Pin/unpin a tab or group (pinned items sort first in their container). */
export function setPinned(
    _tx: DocTx,
    _deps: OpDeps,
    _ref: EntityRef,
    _pinned: boolean,
): void {
    notImplemented("ops.setPinned");
}
export function setLocked(
    _tx: DocTx,
    _deps: OpDeps,
    _groupId: Id,
    _locked: boolean,
): void {
    notImplemented("ops.setLocked");
}
export function setArchived(
    _tx: DocTx,
    _deps: OpDeps,
    _groupId: Id,
    _archived: boolean,
): void {
    notImplemented("ops.setArchived");
}
export function setTag(
    _tx: DocTx,
    _deps: OpDeps,
    _tabId: Id,
    _tagId: Id,
    _on: boolean,
): void {
    notImplemented("ops.setTag");
}

// --- movement (reorder + reparent are the same field write) ---------------
export function moveTab(
    _tx: DocTx,
    _deps: OpDeps,
    _tabId: Id,
    _dest: { groupId: Id } & Position,
): void {
    notImplemented("ops.moveTab");
}
export function moveGroup(
    _tx: DocTx,
    _deps: OpDeps,
    _groupId: Id,
    _dest: { workspaceId: Id; parentId: Id | null } & Position,
): void {
    notImplemented("ops.moveGroup");
}
export function moveFolder(
    _tx: DocTx,
    _deps: OpDeps,
    _folderId: Id,
    _dest: { workspaceId: Id; parentId: Id | null } & Position,
): void {
    notImplemented("ops.moveFolder");
}

// --- lifecycle (soft delete cascades; restore reverses) -------------------
export function softDelete(_tx: DocTx, _deps: OpDeps, _ref: EntityRef): void {
    notImplemented("ops.softDelete");
}
export function restore(_tx: DocTx, _deps: OpDeps, _ref: EntityRef): void {
    notImplemented("ops.restore");
}
