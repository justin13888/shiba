/**
 * @shiba/core — pure, framework-agnostic domain logic.
 *
 * Never imports from the browser, Solid, IndexedDB, Yjs, the network, or any
 * concrete crypto implementation. It defines the model, the ports every adapter
 * implements, and all logic over a {@link DocSnapshot} — unit-testable in Node.
 */

export * from "./analytics";
export * from "./commands";
export { CORE_SCHEMA_VERSION } from "./constants";
export * from "./doc";
export * from "./import-export";
export * from "./migration";
export * from "./model";
export * from "./ordering/fractional-index";
export * from "./ports";
export * from "./search";
export * from "./snapshot";
export * from "./sync";
