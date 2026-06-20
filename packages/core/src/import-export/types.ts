/** Normalized result of parsing any external export format. */
export interface ImportedTab {
    url: string;
    title: string;
}
export interface ImportedGroup {
    name?: string;
    tabs: ImportedTab[];
}
export type ImportedData = ImportedGroup[];
