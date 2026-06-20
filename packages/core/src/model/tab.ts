import * as v from "valibot";
import { FracIndexSchema, IdSchema, MillisSchema, softEntries } from "./common";

/** A saved tab — a leaf within a group. */
export const TabSchema = v.object({
    id: IdSchema,
    ...softEntries,
    groupId: IdSchema,
    order: FracIndexSchema,
    // Lenient on purpose: browser tabs may carry non-http schemes (chrome://,
    // about:, file://) that strict URL validation would wrongly reject.
    url: v.pipe(v.string(), v.nonEmpty()),
    title: v.string(),
    favicon: v.optional(v.string()),
    notes: v.optional(v.string()),
    tagIds: v.array(IdSchema),
    pinned: v.boolean(),
    addedAt: MillisSchema,
    lastOpenedAt: v.optional(MillisSchema),
    openCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
    /** Short text excerpt captured at save time to enrich semantic search. */
    excerpt: v.optional(v.string()),
});

export type Tab = v.InferOutput<typeof TabSchema>;
