import * as v from "valibot";
import { IdSchema, softEntries } from "./common";

/** A cross-cutting label applied to tabs. */
export const TagSchema = v.object({
    id: IdSchema,
    ...softEntries,
    name: v.string(),
    color: v.optional(v.string()),
});

export type Tag = v.InferOutput<typeof TagSchema>;
