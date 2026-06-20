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
