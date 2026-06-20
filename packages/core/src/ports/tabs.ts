/** A browser tab as seen through the extension's tab APIs. */
export interface BrowserTab {
    /** Browser-assigned id of the live tab, if it is open. */
    id?: number;
    title: string;
    url: string;
    favIconUrl?: string;
    windowId?: number;
}

export interface OpenOptions {
    newWindow?: boolean;
}

/** Hides `browser.tabs`/`browser.windows` so save/restore logic is testable. */
export interface BrowserTabs {
    queryHighlighted(): Promise<BrowserTab[]>;
    queryCurrentWindow(): Promise<BrowserTab[]>;
    queryAllWindows(): Promise<BrowserTab[]>;
    open(urls: string[], options?: OpenOptions): Promise<void>;
    close(ids: number[]): Promise<void>;
    /** Focus an already-open tab matching `url`, else open it. */
    focusOrOpen(url: string): Promise<void>;
}
