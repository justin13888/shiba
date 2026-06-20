import * as v from "valibot";
import { FracIndexSchema, IdSchema, softEntries } from "./common";

/** A top-level context (e.g. Personal, Work) that contains folders and groups. */
export const WorkspaceSchema = v.object({
    id: IdSchema,
    ...softEntries,
    name: v.string(),
    /** Lucide icon key; resolved to a component in the UI (never a function here). */
    iconName: v.optional(v.string()),
    color: v.optional(v.string()),
    order: FracIndexSchema,
    isDefault: v.boolean(),
});

export type Workspace = v.InferOutput<typeof WorkspaceSchema>;
