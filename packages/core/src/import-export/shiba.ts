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

const byId = <T extends { id: string }>(records: T[]): Record<string, T> =>
    Object.fromEntries(records.map((record) => [record.id, record]));

/**
 * Re-key a parsed backup into a {@link DocSnapshot} so it can be fed to
 * `materializeDocSnapshot` — the same restore path a local snapshot uses. This is
 * what makes a `.shiba.json` file a true round-trippable backup, not just an
 * export.
 */
export function shibaToSnapshot(data: ShibaExport): DocSnapshot {
    return {
        schemaVersion: data.version,
        workspaces: byId(data.workspaces),
        folders: byId(data.folders),
        groups: byId(data.groups),
        tabs: byId(data.tabs),
        tags: byId(data.tags),
    };
}
