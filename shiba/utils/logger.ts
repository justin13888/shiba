import { type DBSchema, openDB } from "idb";

/** Log Level */
export enum LogLevel {
    TRACE = "TRACE",
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    FATAL = "FATAL",
}

/** Map log levels to numeric values */
const LEVEL_MAP: Record<LogLevel, number> = {
    [LogLevel.TRACE]: 10,
    [LogLevel.DEBUG]: 20,
    [LogLevel.INFO]: 30,
    [LogLevel.WARN]: 40,
    [LogLevel.ERROR]: 50,
    [LogLevel.FATAL]: 60,
};

/** Level Filter */
export enum LevelFilter {
    ALL = "ALL",
    TRACE = "TRACE",
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    FATAL = "FATAL",
    OFF = "OFF",
}

const LEVEL_FILTER_MAP: Record<LevelFilter, number> = {
    [LevelFilter.ALL]: 0,
    [LevelFilter.TRACE]: 10,
    [LevelFilter.DEBUG]: 20,
    [LevelFilter.INFO]: 30,
    [LevelFilter.WARN]: 40,
    [LevelFilter.ERROR]: 50,
    [LevelFilter.FATAL]: 60,
    [LevelFilter.OFF]: 100,
};

export interface LogEntry {
    /** Unix timstamp in milliseconds */
    timestamp: number;
    /**
     * Log level
     */
    level: LogLevel;
    /**
     * Unique identifier for the logger.
     */
    identifier: string;
    message: string;
    // biome-ignore lint/suspicious/noExplicitAny: Required
    meta: any[];
}

// Define your IndexedDB schema
interface LogDB extends DBSchema {
    logs: {
        key: string;
        value: LogEntry;
    };
}

// Initialize IndexedDB
const dbPromise = openDB<LogDB>("logs", 1, {
    upgrade(db) {
        db.createObjectStore("logs", { keyPath: "id", autoIncrement: true });
    },
});

/**
 * Get logs from IndexedDB from newest to oldest.
 * @param cursor Cursor to start from
 * @param limit Maximum number of logs to retrieve
 */
export const getLogs = async (lastKey: number | undefined, limit: number) => {
    const db = await dbPromise;
    const tx = db.transaction("logs", "readonly");
    const store = tx.objectStore("logs");

    const logs: LogEntry[] = [];

    let cursor = await store.openCursor(
        lastKey ? IDBKeyRange.upperBound(lastKey, true) : undefined,
        "prev",
    );

    while (cursor && logs.length < limit) {
        logs.push(cursor.value);
        cursor = await cursor.continue();
    }

    await tx.done;

    return logs;
};

const DEFAULT_LOG_LEVEL: LevelFilter = LevelFilter.DEBUG; // TODO: Make this configurable and defined via extension settings

export class Logger {
    /**
     * Unique identifier for the logger.
     */
    identifier: string;

    /**
     * Minimum log level to log.
     */
    level: number;
    // TODO: attribute

    /**
     *
     * @param identifier Unique identifier for the logger.
     */
    constructor(identifier: string) {
        this.identifier = identifier;
        this.level = LEVEL_FILTER_MAP[DEFAULT_LOG_LEVEL];
    }

    /**
     * Logs a message
     * @param level Log level
     */
    // biome-ignore lint/suspicious/noExplicitAny: Required
    private _log(level: LogLevel, message: string, meta: any[]) {
        if (!this._shouldLog(level)) {
            return;
        }

        const logEntry: LogEntry = {
            timestamp: Date.now(),
            level,
            identifier: this.identifier,
            message,
            meta: structuredClone(meta),
        };

        // Save to IndexedDB
        dbPromise.then(async (db) => {
            await db.add("logs", logEntry);
        });
    }

    private _shouldLog(level: LogLevel): boolean {
        return LEVEL_MAP[level] >= this.level;
    }

    // biome-ignore lint/suspicious/noExplicitAny: Require
    trace(message: string, ...meta: any[]) {
        this._log(LogLevel.TRACE, message, meta);
    }
    // biome-ignore lint/suspicious/noExplicitAny: Require
    debug(message: string, ...meta: any[]) {
        this._log(LogLevel.DEBUG, message, meta);
    }
    // biome-ignore lint/suspicious/noExplicitAny: Require
    info(message: string, ...meta: any[]) {
        this._log(LogLevel.INFO, message, meta);
    }
    // biome-ignore lint/suspicious/noExplicitAny: Require
    warn(message: string, ...meta: any[]) {
        this._log(LogLevel.WARN, message, meta);
    }
    // biome-ignore lint/suspicious/noExplicitAny: Require
    error(message: string, ...meta: any[]) {
        this._log(LogLevel.ERROR, message, meta);
    }
    // biome-ignore lint/suspicious/noExplicitAny: Require
    fatal(message: string, ...meta: any[]) {
        this._log(LogLevel.FATAL, message, meta);
    }
}

// export con

// // TODO
// // Initialize
// // Log levels
// // asynchronous logging + batching
// // Saving to IndexedDB
// // Formatter for pretty printing
// // Log rollover
