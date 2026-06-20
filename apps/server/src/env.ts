import * as v from "valibot";

const EnvSchema = v.object({
    NODE_ENV: v.optional(
        v.picklist(["development", "production", "test"]),
        "development",
    ),
    PORT: v.optional(
        v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
        "3000",
    ),
    LOG_LEVEL: v.optional(v.string(), "info"),
    /** Path to the SQLite database file. */
    DB_PATH: v.optional(v.string(), "./shiba.sqlite"),
    /** Bootstrap secret that authorizes minting the first device token. */
    SHIBA_SERVER_SECRET: v.optional(v.string()),
});

export type Env = v.InferOutput<typeof EnvSchema>;

export const env: Env = v.parse(EnvSchema, process.env);
