import { serveBridge } from "./messages";
import { buildWorkerRuntime, type WorkerRuntime } from "./runtime";

let runtimePromise: Promise<WorkerRuntime> | null = null;

/**
 * The worker's single {@link WorkerRuntime}, built once per service-worker
 * lifetime and rehydrated from IndexedDB after an MV3 eviction.
 */
export function getWorkerRuntime(): Promise<WorkerRuntime> {
    runtimePromise ??= buildWorkerRuntime();
    return runtimePromise;
}

export type { WorkerRuntime } from "./runtime";
export { serveBridge };
