import * as v from "valibot";
import { FracIndexSchema, IdSchema, softEntries } from "./common";

/** A nestable container inside a workspace. `parentId: null` means top-level. */
export const FolderSchema = v.object({
    id: IdSchema,
    ...softEntries,
    workspaceId: IdSchema,
    parentId: v.nullable(IdSchema),
    name: v.string(),
    color: v.optional(v.string()),
    order: FracIndexSchema,
    collapsed: v.optional(v.boolean()),
});

export type Folder = v.InferOutput<typeof FolderSchema>;
