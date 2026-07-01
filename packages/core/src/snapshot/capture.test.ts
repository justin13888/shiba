import { describe, expect, it } from "vitest";
import type { SnapshotMeta } from "../ports/storage";
import { planCapture } from "./capture";
import type { RetentionPolicy } from "./retention";

const NOW = 1_000_000_000_000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Explicit policy so this test is independent of the shipped default.
const HOURLY: RetentionPolicy[] = [
    { id: "hourly", frequencyMs: HOUR, retainMs: DAY },
];

const meta = (
    id: string,
    createdAt: number,
    stateHash?: string,
): SnapshotMeta => ({
    id,
    createdAt,
    deviceId: "d",
    triggers: ["hourly"],
    tabCount: 0,
    groupCount: 0,
    stateHash,
});

describe("planCapture", () => {
    it("captures when due with no prior snapshot", () => {
        expect(planCapture([], HOURLY, NOW, "h1").shouldCapture).toBe(true);
    });

    it("skips capture when due but content is unchanged", () => {
        const snaps = [meta("s", NOW - 2 * HOUR, "same")];
        expect(planCapture(snaps, HOURLY, NOW, "same").shouldCapture).toBe(
            false,
        );
    });

    it("captures when due and content changed", () => {
        const snaps = [meta("s", NOW - 2 * HOUR, "old")];
        expect(planCapture(snaps, HOURLY, NOW, "new").shouldCapture).toBe(true);
    });

    it("does not capture before the cadence elapses, even if changed", () => {
        const snaps = [meta("s", NOW - 1000, "old")];
        expect(planCapture(snaps, HOURLY, NOW, "new").shouldCapture).toBe(
            false,
        );
    });

    it("evicts expired snapshots even when skipping an unchanged capture", () => {
        const old = meta("old", NOW - 2 * DAY, "x");
        const plan = planCapture([old], HOURLY, NOW, "x");
        expect(plan.shouldCapture).toBe(false);
        expect(plan.expiredIds).toContain("old");
    });
});
