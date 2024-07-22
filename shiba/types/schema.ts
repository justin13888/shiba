import type { DBSchema } from "idb";
import type { Tab, TabGroup } from "@/types/model";

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
