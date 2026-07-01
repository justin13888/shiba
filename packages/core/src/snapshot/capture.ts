import type { Id, Millis } from "../model";
import type { SnapshotMeta } from "../ports/storage";
import { planRetention, type RetentionPolicy } from "./retention";

export interface CapturePlan {
    /** Capture a new snapshot now: a policy is due AND the content changed. */
    shouldCapture: boolean;
    /** Policy ids whose cadence is due (recorded on the captured snapshot). */
    triggers: string[];
    /** Snapshots to evict — happens regardless of whether we capture. */
    expiredIds: Id[];
}

/**
 * Decide what the hourly backup should do. Layers change-detection over the pure
 * time-based {@link planRetention}: even when a policy's cadence is due, skip the
 * capture if the document is byte-identical to the newest snapshot (so idle hours
 * cost nothing). Eviction of expired snapshots is independent of that gate.
 */
export function planCapture(
    snapshots: SnapshotMeta[],
    policies: RetentionPolicy[],
    now: Millis,
    currentHash: string,
): CapturePlan {
    const plan = planRetention(snapshots, policies, now);
    const newest = newestOf(snapshots);
    const unchanged = newest?.stateHash === currentHash;
    return {
        shouldCapture: plan.shouldCapture && !unchanged,
        triggers: plan.triggers,
        expiredIds: plan.expiredIds,
    };
}

function newestOf(snapshots: SnapshotMeta[]): SnapshotMeta | undefined {
    let newest: SnapshotMeta | undefined;
    for (const s of snapshots) {
        if (!newest || s.createdAt > newest.createdAt) newest = s;
    }
    return newest;
}
