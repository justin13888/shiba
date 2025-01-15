import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
    manifest: {
        name: "Shiba",
        permissions: [
            "contextMenus",
            "storage",
            "tabs",
            "activeTab",
            "notifications",
        ],
        // browser_action
        // browser_specific_settings
        author: "Justin Chung",
        browser_specific_settings: {
            gecko: {
                id: "shiba@justinchung.net",
            },
        },
        commands: {
            "save-selected-tabs": {
                suggested_key: {
                    default: "Alt+Shift+W",
                },
                description: "__MSG_cmd_store_selected_tabs__",
            },
            "save-all-tabs": {
                suggested_key: {
                    default: "Alt+Shift+T",
                },
                description: "__MSG_cmd_store_all_tabs__",
            },
            "open-lists": {
                suggested_key: {
                    default: "Alt+Shift+S",
                },
                description: "__MSG_cmd_open_lists__",
            },
        },
    },
    modules: ["@wxt-dev/module-solid"],
    imports: false,
});
