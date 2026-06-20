import * as ops from "../doc/ops";
import type { Id } from "../model";
import type { DocTx } from "../ports/crdt";
import type { ImportedData } from "./types";

export interface ImportTarget {
    workspaceId: Id;
    parentId?: Id | null;
}

/** Materialize parsed import data into the document as new groups and tabs. */
export function applyImport(
    tx: DocTx,
    deps: ops.OpDeps,
    data: ImportedData,
    target: ImportTarget,
): ops.SaveResult {
    const groupIds: Id[] = [];
    const tabIds: Id[] = [];
    for (const g of data) {
        const group = ops.createGroup(tx, deps, {
            workspaceId: target.workspaceId,
            parentId: target.parentId ?? null,
            name: g.name,
        });
        groupIds.push(group.id);
        for (const t of g.tabs) {
            tabIds.push(
                ops.createTab(tx, deps, {
                    groupId: group.id,
                    url: t.url,
                    title: t.title,
                }).id,
            );
        }
    }
    deps.analytics?.record({
        type: "tabs_imported",
        at: deps.clock.now(),
        count: tabIds.length,
    });
    return { groupIds, tabIds };
}
