import { describe, expect, it } from "vitest";
import type { AnalyticsEvent } from "../ports/analytics-sink";
import { must } from "../testing";
import { summarize } from "./aggregate";

describe("summarize", () => {
    it("totals, buckets by day/hour, and ranks labels", () => {
        const events: AnalyticsEvent[] = [
            { type: "tab_saved", at: Date.UTC(2026, 0, 1, 10), count: 3 },
            { type: "tab_saved", at: Date.UTC(2026, 0, 2, 11), count: 2 },
            {
                type: "tab_restored",
                at: Date.UTC(2026, 0, 2, 11),
                label: "a.com",
            },
            {
                type: "tab_opened",
                at: Date.UTC(2026, 0, 2, 11),
                label: "a.com",
            },
        ];
        const s = summarize(events);
        expect(s.totalSaved).toBe(5);
        expect(s.totalRestored).toBe(1);
        expect(s.savedByDay).toHaveLength(2);
        expect(s.byHour[10]).toBe(1);
        expect(s.byHour[11]).toBe(3);
        expect(must(s.topLabels[0])).toEqual({ label: "a.com", count: 2 });
    });
});
