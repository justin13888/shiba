import * as v from "valibot";
import { FracIndexSchema, IdSchema, MillisSchema, softEntries } from "./common";

/**
 * A saved list of tabs — the unit created when you "save tabs". Lives directly
 * under a workspace (`parentId: null`) or inside a folder.
 */
export const GroupSchema = v.object({
    id: IdSchema,
    ...softEntries,
    workspaceId: IdSchema,
    parentId: v.nullable(IdSchema),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    order: FracIndexSchema,
    pinned: v.boolean(),
    locked: v.boolean(),
    /** Non-null means archived (hidden from the main view but kept and synced). */
    archivedAt: v.nullable(MillisSchema),
    savedAt: MillisSchema,
});

export type Group = v.InferOutput<typeof GroupSchema>;
