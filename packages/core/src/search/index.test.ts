import { describe, expect, it } from "vitest";
import { cosineSimilarity, hybridSearch, lexicalSearch } from "./index";

const DOCS = [
    { id: "1", title: "GitHub", url: "https://github.com" },
    { id: "2", title: "GitLab repos", url: "https://gitlab.com" },
    { id: "3", title: "News", url: "https://news.com" },
];

describe("search", () => {
    it("lexical matches title and url", () => {
        expect(lexicalSearch("github", DOCS).map((r) => r.id)).toEqual(["1"]);
        expect(lexicalSearch("repos", DOCS).map((r) => r.id)).toEqual(["2"]);
    });

    it("cosine similarity is 1 for identical and 0 for orthogonal", () => {
        expect(
            cosineSimilarity(Float32Array.of(1, 0), Float32Array.of(1, 0)),
        ).toBeCloseTo(1);
        expect(
            cosineSimilarity(Float32Array.of(1, 0), Float32Array.of(0, 1)),
        ).toBeCloseTo(0);
    });

    it("hybrid falls back to semantic when lexical misses", () => {
        const vectors = new Map([
            ["1", Float32Array.of(1, 0)],
            ["2", Float32Array.of(0, 1)],
        ]);
        const results = hybridSearch({
            query: "zzz",
            docs: DOCS.slice(0, 2),
            queryVector: Float32Array.of(1, 0),
            vectors,
        });
        expect(results[0]?.id).toBe("1");
    });
});
