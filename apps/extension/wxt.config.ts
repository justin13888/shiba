import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ["@wxt-dev/module-solid"],
    // Deduplicate Solid to a single copy resolved from the extension root.
    // Required in this pnpm monorepo: the Solid auto-import preset injects a
    // `solid-js` import into framework-free workspace packages (e.g. the `on`
    // export collides with a parameter in @shiba/core), which can't resolve
    // `solid-js` on their own. Deduping also prevents duplicate reactive
    // runtimes when bundling workspace dependencies.
    vite: () => ({
        resolve: { dedupe: ["solid-js", "solid-js/web", "solid-js/store"] },
    }),
    imports: false,
    manifest: {
        name: "Shiba",
        permissions: ["storage", "tabs", "alarms", "contextMenus"],
        browser_specific_settings: {
            gecko: { id: "shiba@justinchung.net" },
        },
        commands: {
            "save-selected-tabs": {
                suggested_key: { default: "Alt+Shift+S" },
                description: "Save highlighted tabs to Shiba",
            },
            "save-all-tabs": {
                suggested_key: { default: "Alt+Shift+A" },
                description: "Save all tabs in this window to Shiba",
            },
            "open-saved": {
                suggested_key: { default: "Alt+Shift+O" },
                description: "Open Shiba",
            },
        },
    },
});
