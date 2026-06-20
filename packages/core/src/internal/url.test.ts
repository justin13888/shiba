import { describe, expect, it } from "vitest";
import { hostnameOf } from "./url";

describe("hostnameOf", () => {
    it.each([
        ["https://www.example.com/path?q=1", "www.example.com"],
        ["http://EXAMPLE.com", "example.com"],
        ["https://user:pass@host.com:8080/x", "host.com"],
        ["about:blank", "about"],
        ["file:///home/user/page.html", "file"],
    ])("%s -> %s", (url, expected) => {
        expect(hostnameOf(url)).toBe(expected);
    });
});
