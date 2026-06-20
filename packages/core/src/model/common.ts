import * as v from "valibot";

/** Unique identifier (a nanoid). */
export type Id = string;
/** Fractional-index key used to order siblings (e.g. `"a0"`, `"a0V"`). */
export type FracIndex = string;
/** Milliseconds since the Unix epoch. */
export type Millis = number;

export const IdSchema = v.pipe(v.string(), v.nonEmpty());
export const FracIndexSchema = v.pipe(v.string(), v.nonEmpty());
export const MillisSchema = v.pipe(v.number(), v.integer(), v.minValue(0));

/** Lifecycle fields every synced record carries. */
export interface Soft {
    createdAt: Millis;
    updatedAt: Millis;
    /** Tombstone: non-null means the record is soft-deleted (in Trash). */
    deletedAt: Millis | null;
}

/** Valibot entries for {@link Soft}, spread into each entity schema. */
export const softEntries = {
    createdAt: MillisSchema,
    updatedAt: MillisSchema,
    deletedAt: v.nullable(MillisSchema),
} as const;

/** The kinds of records the document holds. */
export type EntityKind = "workspace" | "folder" | "group" | "tab" | "tag";

/** A typed pointer to a record, used by generic operations. */
export interface EntityRef {
    kind: EntityKind;
    id: Id;
}
