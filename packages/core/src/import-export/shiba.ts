import * as v from "valibot";
import {
    type DocSnapshot,
    type Folder,
    FolderSchema,
    type Group,
    GroupSchema,
    type Millis,
    type Tab,
    TabSchema,
    type Tag,
    TagSchema,
    type Workspace,
    WorkspaceSchema,
} from "../model";

/** Full-fidelity, portable Shiba backup. */
export interface ShibaExport {
    format: "shiba";
    version: number;
    exportedAt: Millis;
    workspaces: Workspace[];
    folders: Folder[];
    groups: Group[];
    tabs: Tab[];
    tags: Tag[];
}

const live = <T extends { deletedAt: Millis | null }>(
    record: Readonly<Record<string, T>>,
): T[] => Object.values(record).filter((r) => r.deletedAt === null);

export function exportShiba(
    snap: DocSnapshot,
    exportedAt: Millis,
): ShibaExport {
    return {
        format: "shiba",
        version: snap.schemaVersion,
        exportedAt,
        workspaces: live(snap.workspaces),
        folders: live(snap.folders),
        groups: live(snap.groups),
        tabs: live(snap.tabs),
        tags: live(snap.tags),
    };
}

export function serializeShiba(data: ShibaExport): string {
    return JSON.stringify(data, null, 2);
}

const ShibaExportSchema = v.object({
    format: v.literal("shiba"),
    version: v.number(),
    exportedAt: v.number(),
    workspaces: v.array(WorkspaceSchema),
    folders: v.array(FolderSchema),
    groups: v.array(GroupSchema),
    tabs: v.array(TabSchema),
    tags: v.array(TagSchema),
});

/** Parse and validate a Shiba backup; throws on a malformed/foreign document. */
export function parseShiba(json: string): ShibaExport {
    return v.parse(ShibaExportSchema, JSON.parse(json));
}
