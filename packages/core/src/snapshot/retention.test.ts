import { describe, expect, it } from "vitest";
import type { SnapshotMeta } from "../ports/storage";
import { DEFAULT_RETENTION_POLICIES, planRetention } from "./retention";

const NOW = 1_000_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

const meta = (
    id: string,
    createdAt: number,
    triggers: string[],
): SnapshotMeta => ({
    id,
    createdAt,
    deviceId: "d",
    triggers,
    tabCount: 0,
    groupCount: 0,
});

describe("planRetention", () => {
    it("captures when a due policy has no snapshot", () => {
        const plan = planRetention([], DEFAULT_RETENTION_POLICIES, NOW);
        expect(plan.shouldCapture).toBe(true);
        expect(plan.triggers).toEqual(["hourly", "daily"]);
    });

    it("does not capture before the cadence elapses", () => {
        const recent = [meta("s", NOW - 1000, ["hourly", "daily"])];
        const plan = planRetention(recent, DEFAULT_RETENTION_POLICIES, NOW);
        expect(plan.shouldCapture).toBe(false);
    });

    it("expires snapshots past every owning policy's retention", () => {
        const old = meta("old", NOW - 8 * DAY, ["hourly", "daily"]);
        const plan = planRetention([old], DEFAULT_RETENTION_POLICIES, NOW);
        expect(plan.expiredIds).toContain("old");
    });
});
