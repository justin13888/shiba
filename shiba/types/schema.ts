import type { Tab, TabGroup } from "@/types/model";
import type { DBSchema } from "idb";

export interface TabDB extends DBSchema {
    tabGroups: {
        key: string;
        value: TabGroup;
        indexes: {
            byTimeCreated: number;
            byTimeModified: number;
        };
    };
    tabs: {
        key: string;
        value: Tab;
    };
}
