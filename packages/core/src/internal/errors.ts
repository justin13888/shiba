/** Marks a contract whose implementation arrives in a later phase. */
export function notImplemented(what: string): never {
    throw new Error(`Not implemented: ${what}`);
}
