import type { DBSchema } from 'idb';

export interface TabDB extends DBSchema {
    tabGroups: {
        key: string;
        value: TabGroup;
        indexes: {
            'byTimeCreated': number;
        };
    },
    tabs: {
        key: string;
        value: Tab;
        indexes: {
            'byTabGroupId': string;
        };
    };
}
