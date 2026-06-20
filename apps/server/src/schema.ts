import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Hashed device tokens — the relay-access credential (auth layer). */
export const deviceTokens = sqliteTable("device_tokens", {
    tokenHash: text("token_hash").primaryKey(),
    deviceId: text("device_id").notNull(),
    name: text("name"),
    createdAt: integer("created_at").notNull(),
    lastSeenAt: integer("last_seen_at"),
    revoked: integer("revoked", { mode: "boolean" }).notNull().default(false),
});

/** Passphrase-protected key material (single row). Stored ciphertext + salt. */
export const keyMaterial = sqliteTable("key_material", {
    id: integer("id").primaryKey(),
    salt: text("salt").notNull(),
    params: text("params").notNull(),
    wrappedDek: text("wrapped_dek").notNull(),
    recoveryWrap: text("recovery_wrap"),
    updatedAt: integer("updated_at").notNull(),
});

/** Append-only log of opaque encrypted CRDT updates. */
export const docUpdates = sqliteTable("doc_updates", {
    seq: integer("seq").primaryKey({ autoIncrement: true }),
    deviceId: text("device_id").notNull(),
    nonce: text("nonce").notNull(),
    ciphertext: text("ciphertext").notNull(),
    createdAt: integer("created_at").notNull(),
});
