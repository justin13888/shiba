import {  DBSchema } from 'idb';

export interface TabDB extends DBSchema {
    tabs: {
        key: string;
        value: TabGroup;
        indexes: { 'byTimeCreated': number };
    };
}
