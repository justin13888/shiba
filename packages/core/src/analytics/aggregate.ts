import type { AnalyticsEvent } from "../ports/analytics-sink";

export interface DailyCount {
    day: string;
    count: number;
}
export interface LabelCount {
    label: string;
    count: number;
}

export interface AnalyticsSummary {
    totalSaved: number;
    totalRestored: number;
    totalOpened: number;
    totalImported: number;
    /** Tabs saved/imported per UTC day, ascending. */
    savedByDay: DailyCount[];
    /** Event counts per UTC hour (length 24). */
    byHour: number[];
    /** Most frequent labels (e.g. domains), descending, top 10. */
    topLabels: LabelCount[];
}

/** Pure aggregation of local usage events into dashboard-ready metrics. */
export function summarize(events: AnalyticsEvent[]): AnalyticsSummary {
    let totalSaved = 0;
    let totalRestored = 0;
    let totalOpened = 0;
    let totalImported = 0;
    const byDay = new Map<string, number>();
    const byLabel = new Map<string, number>();
    const byHour: number[] = Array.from({ length: 24 }, () => 0);

    for (const e of events) {
        const count = e.count ?? 1;
        if (e.type === "tab_saved") totalSaved += count;
        else if (e.type === "tab_restored") totalRestored += count;
        else if (e.type === "tab_opened") totalOpened += count;
        else if (e.type === "tabs_imported") totalImported += count;

        if (e.type === "tab_saved" || e.type === "tabs_imported") {
            const day = new Date(e.at).toISOString().slice(0, 10);
            byDay.set(day, (byDay.get(day) ?? 0) + count);
        }

        const hour = new Date(e.at).getUTCHours();
        byHour[hour] = (byHour[hour] ?? 0) + 1;

        if (e.label) byLabel.set(e.label, (byLabel.get(e.label) ?? 0) + count);
    }

    return {
        totalSaved,
        totalRestored,
        totalOpened,
        totalImported,
        savedByDay: [...byDay.entries()]
            .map(([day, count]) => ({ day, count }))
            .sort((a, b) => a.day.localeCompare(b.day)),
        byHour,
        topLabels: [...byLabel.entries()]
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
    };
}
