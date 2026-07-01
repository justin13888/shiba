import type {
    NewFolder,
    NewGroup,
    NewTab,
    NewTag,
    NewWorkspace,
    OpDeps,
    Position,
    SaveTabsOptions,
} from "../doc/ops";
import * as ops from "../doc/ops";
import type { EntityRef, Id } from "../model";
import type { DocTx } from "../ports/crdt";
import type { BrowserTab } from "../ports/tabs";

/** Destination for a reparent/reorder move: a container plus a sibling anchor. */
export type MoveDest = { workspaceId: Id; parentId: Id | null } & Position;

/**
 * A serializable mutation intent. Every field is plain JSON data (no closures, no
 * class instances) so a command survives a `postMessage`/`structuredClone` hop —
 * this is what lets a page dispatch a mutation to the background worker that owns
 * the document. Each variant maps 1:1 to an `ops.*` function.
 */
export type Command =
    | { type: "createWorkspace"; input: NewWorkspace }
    | { type: "createFolder"; input: NewFolder }
    | { type: "createGroup"; input: NewGroup }
    | { type: "createTab"; input: NewTab }
    | { type: "createTag"; input: NewTag }
    | { type: "saveBrowserTabs"; tabs: BrowserTab[]; options: SaveTabsOptions }
    | { type: "rename"; ref: EntityRef; name: string }
    | { type: "setNotes"; tabId: Id; notes: string }
    | { type: "setPinned"; ref: EntityRef; pinned: boolean }
    | { type: "setLocked"; groupId: Id; locked: boolean }
    | { type: "setArchived"; groupId: Id; archived: boolean }
    | { type: "setTag"; tabId: Id; tagId: Id; on: boolean }
    | { type: "moveTab"; tabId: Id; dest: { groupId: Id } & Position }
    | { type: "moveGroup"; groupId: Id; dest: MoveDest }
    | { type: "moveFolder"; folderId: Id; dest: MoveDest }
    | { type: "softDelete"; ref: EntityRef }
    | { type: "restore"; ref: EntityRef };

export type CommandType = Command["type"];

/** Ids created or primarily affected by a command (empty only if the target was missing). */
export interface CommandResult {
    ids: Id[];
}

/**
 * Execute a {@link Command} against the document. This is the single mutation
 * entry point crossed by the messaging bridge: the background worker runs it
 * inside one `doc.mutate`, so a command is applied atomically and its resulting
 * delta is broadcast once. Semantics are identical to calling the underlying
 * `ops.*` directly — the switch is exhaustive, so adding a variant without a
 * branch is a compile error.
 */
export function applyCommand(
    tx: DocTx,
    deps: OpDeps,
    cmd: Command,
): CommandResult {
    switch (cmd.type) {
        case "createWorkspace":
            return { ids: [ops.createWorkspace(tx, deps, cmd.input).id] };
        case "createFolder":
            return { ids: [ops.createFolder(tx, deps, cmd.input).id] };
        case "createGroup":
            return { ids: [ops.createGroup(tx, deps, cmd.input).id] };
        case "createTab":
            return { ids: [ops.createTab(tx, deps, cmd.input).id] };
        case "createTag":
            return { ids: [ops.createTag(tx, deps, cmd.input).id] };
        case "saveBrowserTabs":
            return {
                ids: ops.saveBrowserTabs(tx, deps, cmd.tabs, cmd.options)
                    .groupIds,
            };
        case "rename":
            ops.rename(tx, deps, cmd.ref, cmd.name);
            return { ids: [cmd.ref.id] };
        case "setNotes":
            ops.setNotes(tx, deps, cmd.tabId, cmd.notes);
            return { ids: [cmd.tabId] };
        case "setPinned":
            ops.setPinned(tx, deps, cmd.ref, cmd.pinned);
            return { ids: [cmd.ref.id] };
        case "setLocked":
            ops.setLocked(tx, deps, cmd.groupId, cmd.locked);
            return { ids: [cmd.groupId] };
        case "setArchived":
            ops.setArchived(tx, deps, cmd.groupId, cmd.archived);
            return { ids: [cmd.groupId] };
        case "setTag":
            ops.setTag(tx, deps, cmd.tabId, cmd.tagId, cmd.on);
            return { ids: [cmd.tabId] };
        case "moveTab":
            ops.moveTab(tx, deps, cmd.tabId, cmd.dest);
            return { ids: [cmd.tabId] };
        case "moveGroup":
            ops.moveGroup(tx, deps, cmd.groupId, cmd.dest);
            return { ids: [cmd.groupId] };
        case "moveFolder":
            ops.moveFolder(tx, deps, cmd.folderId, cmd.dest);
            return { ids: [cmd.folderId] };
        case "softDelete":
            ops.softDelete(tx, deps, cmd.ref);
            return { ids: [cmd.ref.id] };
        case "restore":
            ops.restore(tx, deps, cmd.ref);
            return { ids: [cmd.ref.id] };
    }
}
