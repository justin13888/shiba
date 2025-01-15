import type { Tab, TabGroup, Workspace } from "@/types/model";
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
        indexes: {
            byGroupId: string;
            byGroupIdOrder: [string, number];
        };
        // TODO: Enforce foreign key constraint for groupId
    };
    workspace: {
        key: string;
        value: Workspace;
        indexes: {
            byOrder: number;
        };
    };
}
