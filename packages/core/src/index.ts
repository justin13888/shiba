/**
 * @shiba/core — pure, framework-agnostic domain logic.
 *
 * This package must never import from the browser, Solid, IndexedDB, Yjs, the
 * network, or any concrete crypto implementation. It defines the model, the
 * ports (interfaces) every adapter implements, and all the logic that operates
 * on a {@link DocSnapshot}. Everything here is unit-testable in plain Node.
 */
export const CORE_SCHEMA_VERSION = 2;
