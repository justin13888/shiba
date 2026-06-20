import type { OpDeps } from "../doc/ops";
import type { AnalyticsEvent } from "../ports/analytics-sink";
import type { Clock, IdGen } from "../ports/clock";

/** A clock you can advance manually, for deterministic timestamps in tests. */
export function manualClock(start = 1_700_000_000_000): Clock & {
    advance(ms: number): void;
} {
    let t = start;
    return {
        now: () => t,
        advance: (ms) => {
            t += ms;
        },
    };
}

/** Sequential ids (`id1`, `id2`, …) for deterministic assertions. */
export function seqIdGen(prefix = "id"): IdGen {
    let n = 0;
    return { next: () => `${prefix}${++n}` };
}

/** Collects recorded analytics events for assertions. */
export function recordingSink(): {
    record(event: AnalyticsEvent): void;
    events: AnalyticsEvent[];
} {
    const events: AnalyticsEvent[] = [];
    return { record: (e) => events.push(e), events };
}

export function testDeps(overrides: Partial<OpDeps> = {}): OpDeps {
    return { clock: manualClock(), ids: seqIdGen(), ...overrides };
}

/** Assert a value is present, narrowing away `undefined`/`null` in tests. */
export function must<T>(value: T | undefined | null): T {
    if (value == null) throw new Error("expected a defined value");
    return value;
}
