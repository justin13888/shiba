import type { Id, Millis } from "../model/common";

/** Injectable wall clock — keeps time-dependent logic deterministic in tests. */
export interface Clock {
    now(): Millis;
}

/** Injectable id generator — keeps id-dependent logic deterministic in tests. */
export interface IdGen {
    next(): Id;
}
