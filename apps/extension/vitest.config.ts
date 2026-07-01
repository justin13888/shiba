import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// The Solid plugin compiles component (`.tsx`) tests; pure logic tests stay in
// the default `node` env, while component tests opt into jsdom per file with a
// `// @vitest-environment jsdom` docblock. The `@` alias mirrors WXT's.
export default defineConfig({
    plugins: [solid()],
    resolve: {
        alias: { "@": import.meta.dirname },
    },
    test: {
        environment: "node",
        setupFiles: ["./vitest.setup.ts"],
    },
});
