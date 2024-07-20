import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
    manifest: {
        name: "Shiba",
        permissions: ["contextMenus", "storage", "tabs", "notifications"],
        // browser_action
        // browser_specific_settings
        author: "Justin Chung",
        browser_specific_settings: {
            gecko: {
                id: "shiba@justinchung.net"
            }
        }
    },
    modules: ["@wxt-dev/module-solid"],
});
// TODO: Define commands/keyboard shortcuts
