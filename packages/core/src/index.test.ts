import { describe, expect, it } from "vitest";
import { CORE_SCHEMA_VERSION } from "./index";

describe("@shiba/core", () => {
    it("declares the current schema version", () => {
        expect(CORE_SCHEMA_VERSION).toBe(2);
    });
});
