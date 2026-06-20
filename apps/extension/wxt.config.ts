import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ["@wxt-dev/module-solid"],
    imports: false,
    manifest: {
        name: "Shiba",
        permissions: ["storage", "tabs", "alarms", "contextMenus"],
        browser_specific_settings: {
            gecko: { id: "shiba@justinchung.net" },
        },
    },
});
