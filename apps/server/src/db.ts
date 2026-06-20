import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

/** Open (or create) the SQLite database and ensure the schema exists. */
export function createDb(path: string) {
    const sqlite = new Database(path);
    sqlite.pragma("journal_mode = WAL");
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS device_tokens (
            token_hash TEXT PRIMARY KEY,
            device_id TEXT NOT NULL,
            name TEXT,
            created_at INTEGER NOT NULL,
            last_seen_at INTEGER,
            revoked INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS key_material (
            id INTEGER PRIMARY KEY,
            salt TEXT NOT NULL,
            params TEXT NOT NULL,
            wrapped_dek TEXT NOT NULL,
            recovery_wrap TEXT,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS doc_updates (
            seq INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            nonce TEXT NOT NULL,
            ciphertext TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );
    `);
    return drizzle(sqlite, { schema });
}
