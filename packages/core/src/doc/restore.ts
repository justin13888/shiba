import type {
    DocSnapshot,
    Folder,
    Group,
    Id,
    Soft,
    Tab,
    Tag,
    Workspace,
} from "../model";
import type { DocTx } from "../ports/crdt";
import type { OpDeps } from "./ops";

export interface RestoreOptions {
    /** Suffix appended to restored workspace names, e.g. a date, to mark the copy. */
    label?: string;
}

export interface RestoreResult {
    /** Ids of the workspaces created by the restore. */
    workspaceIds: Id[];
}

const live = <T extends Soft>(records: Readonly<Record<Id, T>>): T[] =>
    Object.values(records).filter((r) => r.deletedAt === null);

/**
 * Non-destructive "restore as a copy": rematerialize a decoded {@link DocSnapshot}
 * into the live document as brand-new entities. Every live record is recreated
 * with a fresh id, parent/tag references are remapped to the new ids, and
 * workspaces are marked non-default (so the current default is never displaced)
 * and optionally re-labelled. Original timestamps (`createdAt`, `savedAt`, …) are
 * preserved; only `updatedAt` moves to now.
 *
 * Because it never touches existing records, restore can't fight the CRDT/sync
 * layer — it's purely additive, which is exactly what a safety-net wants.
 */
export function materializeDocSnapshot(
    tx: DocTx,
    deps: OpDeps,
    snapshot: DocSnapshot,
    options: RestoreOptions = {},
): RestoreResult {
    const now = deps.clock.now();
    const tags = live<Tag>(snapshot.tags);
    const workspaces = live<Workspace>(snapshot.workspaces);
    const folders = live<Folder>(snapshot.folders);
    const groups = live<Group>(snapshot.groups);
    const tabs = live<Tab>(snapshot.tabs);

    // Assign every id up front so references can be remapped in any order.
    const idOf = new Map<Id, Id>();
    for (const r of [...tags, ...workspaces, ...folders, ...groups, ...tabs]) {
        idOf.set(r.id, deps.ids.next());
    }
    const mapped = (id: Id): Id => idOf.get(id) as Id;

    for (const t of tags) {
        const id = mapped(t.id);
        tx.tags.set(id, { ...t, id, updatedAt: now, deletedAt: null });
    }

    const workspaceIds: Id[] = [];
    for (const w of workspaces) {
        const id = mapped(w.id);
        workspaceIds.push(id);
        tx.workspaces.set(id, {
            ...w,
            id,
            isDefault: false,
            name: options.label ? `${w.name} (${options.label})` : w.name,
            updatedAt: now,
            deletedAt: null,
        });
    }

    for (const f of folders) {
        const workspaceId = idOf.get(f.workspaceId);
        if (!workspaceId) continue; // its workspace wasn't restored; drop the orphan
        const id = mapped(f.id);
        tx.folders.set(id, {
            ...f,
            id,
            workspaceId,
            parentId: f.parentId ? (idOf.get(f.parentId) ?? null) : null,
            updatedAt: now,
            deletedAt: null,
        });
    }

    for (const g of groups) {
        const workspaceId = idOf.get(g.workspaceId);
        if (!workspaceId) continue;
        const id = mapped(g.id);
        tx.groups.set(id, {
            ...g,
            id,
            workspaceId,
            parentId: g.parentId ? (idOf.get(g.parentId) ?? null) : null,
            updatedAt: now,
            deletedAt: null,
        });
    }

    for (const t of tabs) {
        const groupId = idOf.get(t.groupId);
        if (!groupId) continue;
        const id = mapped(t.id);
        tx.tabs.set(id, {
            ...t,
            id,
            groupId,
            tagIds: t.tagIds
                .map((tagId) => idOf.get(tagId))
                .filter((x): x is Id => x !== undefined),
            updatedAt: now,
            deletedAt: null,
        });
    }

    return { workspaceIds };
}
