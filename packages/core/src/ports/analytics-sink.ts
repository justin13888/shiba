import type { Millis } from "../model/common";

export type AnalyticsEventType =
    | "tab_saved"
    | "tab_restored"
    | "tab_opened"
    | "group_created"
    | "group_deleted"
    | "tabs_imported"
    | "search_performed";

export interface AnalyticsEvent {
    type: AnalyticsEventType;
    at: Millis;
    /** Optional magnitude (e.g. number of tabs saved). */
    count?: number;
    /** Optional dimension (e.g. a domain or workspace id). */
    label?: string;
}

/** Records local-only usage events. A no-op implementation is used in tests. */
export interface AnalyticsSink {
    record(event: AnalyticsEvent): void;
}
