import { envs } from "@/env";
import { DATABASE_PREFIX } from "@/lib/constants";
import type { Config } from "drizzle-kit";

export default {
    dialect: "postgresql",
    schema: "src/db/drizzle/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: envs.POSTGRES_URL,
    },
    tablesFilter: [`${DATABASE_PREFIX}_*`],
} satisfies Config;
