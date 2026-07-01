import { reconcile } from "@shiba/core";
import { browser } from "wxt/browser";
import type { WorkerRuntime } from "./runtime";

const COMPACT_ALARM = "shiba-compact";
const RECONCILE_ALARM = "shiba-reconcile";

const DAY_MINUTES = 24 * 60;
/** Hard-purge tombstones this old during the reconcile sweep. */
const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function ensureAlarm(
    name: string,
    periodInMinutes: number,
): Promise<void> {
    // Don't recreate on every worker wake — that would reset the timer and, with
    // frequent MV3 evictions, could starve a long-period alarm.
    if (!(await browser.alarms.get(name))) {
        browser.alarms.create(name, { periodInMinutes });
    }
}

async function handleAlarm(
    name: string,
    getRuntime: () => Promise<WorkerRuntime>,
): Promise<void> {
    if (name === COMPACT_ALARM) {
        await (await getRuntime()).compact();
    } else if (name === RECONCILE_ALARM) {
        const runtime = await getRuntime();
        runtime.doc.mutate((tx) =>
            reconcile(tx, runtime.deps, { tombstoneTtlMs: TOMBSTONE_TTL_MS }),
        );
    }
}

/**
 * Register the worker's maintenance alarms. Compaction collapses the append-log
 * baseline; the reconcile sweep is the document's self-heal (purge expired
 * tombstones, break folder cycles, re-parent orphans, repair order) that
 * `architecture.md` promised but nothing ran. The `onAlarm` listener is
 * registered synchronously so wake-up events aren't missed.
 */
export function registerMaintenanceAlarms(
    getRuntime: () => Promise<WorkerRuntime>,
): void {
    browser.alarms.onAlarm.addListener((alarm) => {
        void handleAlarm(alarm.name, getRuntime);
    });
    void ensureAlarm(COMPACT_ALARM, 60);
    void ensureAlarm(RECONCILE_ALARM, DAY_MINUTES);
}
