// TODO: Rewrite this schema.

import {
    USERNAME_MAX_LENGTH,
    DATABASE_PREFIX as prefix,
} from "@/lib/constants";
import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    pgEnum,
    pgTableCreator,
    serial,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

export const pgTable = pgTableCreator((name) => `${prefix}_${name}`);

export const accountStatusEnum = pgEnum("account_status", [
    "active",
    "inactive",
    "banned",
]);
// TODO: Implement email verification
export const users = pgTable("users", {
    username: varchar("username", { length: USERNAME_MAX_LENGTH }).primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    status: accountStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// export const osEnum = pgEnum("os", [
//     "windows",
//     "mac",
//     "linux",
//     "android",
//     "ios",
//     "other",
// ]);
// export const loginMethodEnum = pgEnum("login_method", ["password", "qr_code"]);

// export const sessions = pgTable(
//     "sessions",
//     {
//         id: varchar("id", { length: 255 }).primaryKey(),
//         createdAt: timestamp("created_at").defaultNow().notNull(),
//         expiresAt: timestamp("expires_at").notNull(),
//         lastUsedAt: timestamp("last_used_at").notNull(),
//         username: varchar("username", { length: 255 }).notNull(),
//         deviceName: varchar("device_name", { length: 255 }).notNull(),
//         os: osEnum("os").notNull(),
//         ip: text("ip").notNull(), // TODO: Change to better type
//         loginMethod: loginMethodEnum("login_method").notNull(),
//         revoked: boolean("revoked").default(false).notNull(),
//     },
//     (t) => ({
//         usernameIdx: index("username_idx").on(t.username),
//         revokedIdx: index("revoked_idx").on(t.revoked),
//         expiresAtIdx: index("expires_at_idx").on(t.expiresAt),
//     }),
// );

// export type Session = typeof sessions.$inferSelect;
// export type NewSession = typeof sessions.$inferSelect;

// export const sessionRelations = relations(sessions, ({ one }) => ({
//     user: one(users, {
//         fields: [sessions.username],
//         references: [users.username],
//     }),
// }));

// export const loginHistory = pgTable(
//     "login_history",
//     {
//         id: serial("id").primaryKey(),
//         username: varchar("username", { length: 255 }).notNull(),
//         timestamp: timestamp("timestamp").notNull().defaultNow(),
//         ip: text("ip").notNull(), // TODO: Change to better type
//         os: osEnum("os").notNull(),
//         deviceName: varchar("device_name", { length: 255 }).notNull(),
//     },
//     (t) => ({
//         timestampIdx: index("timestamp_idx").on(t.timestamp),
//     }),
// );

// export type LoginHistory = typeof loginHistory.$inferSelect;

// export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
//     user: one(users, {
//         fields: [loginHistory.username],
//         references: [users.username],
//     }),
// }));

// export const passwordResetTokens = pgTable(
//     "password_reset_tokens",
//     {
//         id: uuid("id").defaultRandom().primaryKey(),
//         token: varchar("token", { length: 255 }).notNull(),
//         userId: varchar("user_id", { length: 21 }).notNull(),
//         expiresAt: timestamp("expires_at").notNull(),
//     },
//     (t) => ({
//         tokenIdx: index("token_idx").on(t.token),
//         // userIdx: index("user_idx").on(t.userId),
//     }),
// );

// export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// export const passwordResetTokenRelations = relations(
//     passwordResetTokens,
//     ({ one }) => ({
//         user: one(users, {
//             fields: [passwordResetTokens.userId],
//             references: [users.username],
//         }),
//     }),
// );
