import type { Id, Millis } from "../model";
import type { SnapshotMeta } from "../ports/storage";

/** A snapshot cadence: capture every `frequencyMs`, keep for `retainMs`. */
export interface RetentionPolicy {
    id: string;
    frequencyMs: number;
    retainMs: number;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * The shipped policy: capture at most hourly, keep for one week, then auto-evict.
 * A single stable id keeps retention deterministic (no per-load regeneration).
 * This backup is a temporary safety-net while the CRDT/sync layer matures — see
 * docs/backup.md.
 */
export const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
    { id: "hourly", frequencyMs: HOUR, retainMs: WEEK },
];

export interface RetentionPlan {
    shouldCapture: boolean;
    /** Policy ids whose cadence is due. */
    triggers: string[];
    /** Snapshots past retention for every policy that triggered them. */
    expiredIds: Id[];
}

/** Pure retention decision: what to capture now and what to prune. */
export function planRetention(
    snapshots: SnapshotMeta[],
    policies: RetentionPolicy[],
    now: Millis,
): RetentionPlan {
    const triggers: string[] = [];
    for (const policy of policies) {
        let last = 0;
        for (const s of snapshots) {
            if (s.triggers.includes(policy.id) && s.createdAt > last)
                last = s.createdAt;
        }
        if (now - last >= policy.frequencyMs) triggers.push(policy.id);
    }

    const expiredIds: Id[] = [];
    for (const s of snapshots) {
        const owning = policies.filter((p) => s.triggers.includes(p.id));
        if (
            owning.length > 0 &&
            owning.every((p) => now - s.createdAt > p.retainMs)
        ) {
            expiredIds.push(s.id);
        }
    }

    return { shouldCapture: triggers.length > 0, triggers, expiredIds };
}
