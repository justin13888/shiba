import type { Id } from "../model";

export interface SearchDoc {
    id: Id;
    title: string;
    url: string;
    notes?: string;
}

export interface SearchResult {
    id: Id;
    score: number;
}

/** Weighted substring/token scoring across a tab's text fields. */
export function lexicalScore(query: string, doc: SearchDoc): number {
    const q = query.trim().toLowerCase();
    if (!q) return 0;
    const title = doc.title.toLowerCase();
    const url = doc.url.toLowerCase();
    const notes = (doc.notes ?? "").toLowerCase();

    let score = 0;
    if (title.includes(q)) score += 10;
    if (url.includes(q)) score += 4;
    if (notes.includes(q)) score += 2;
    if (title.startsWith(q)) score += 5;

    for (const token of q.split(/\s+/).filter(Boolean)) {
        if (title.includes(token)) score += 3;
        else if (url.includes(token)) score += 1.5;
        else if (notes.includes(token)) score += 1;
    }
    return score;
}

export function lexicalSearch(
    query: string,
    docs: SearchDoc[],
): SearchResult[] {
    return docs
        .map((doc) => ({ id: doc.id, score: lexicalScore(query, doc) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score);
}

/** Cosine similarity; returns 0 for a zero vector. */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
    const n = Math.min(a.length, b.length);
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < n; i++) {
        const x = a[i] ?? 0;
        const y = b[i] ?? 0;
        dot += x * y;
        na += x * x;
        nb += y * y;
    }
    if (na === 0 || nb === 0) return 0;
    return dot / Math.sqrt(na * nb);
}

export interface HybridOptions {
    query: string;
    docs: SearchDoc[];
    queryVector?: Float32Array;
    vectors?: ReadonlyMap<Id, Float32Array>;
    weights?: { lexical: number; semantic: number };
    limit?: number;
}

/**
 * Combine normalized lexical and semantic scores. Lexical alone covers the
 * always-on case; passing `queryVector`+`vectors` blends in semantic similarity.
 */
export function hybridSearch(options: HybridOptions): SearchResult[] {
    const wl = options.weights?.lexical ?? 1;
    const ws = options.weights?.semantic ?? 1;

    const lexical = new Map(
        lexicalSearch(options.query, options.docs).map((r) => [r.id, r.score]),
    );
    const maxLexical = Math.max(1, ...lexical.values());

    const results = options.docs
        .map((doc) => {
            const l = (lexical.get(doc.id) ?? 0) / maxLexical;
            let s = 0;
            if (options.queryVector && options.vectors) {
                const vec = options.vectors.get(doc.id);
                if (vec)
                    s = Math.max(0, cosineSimilarity(options.queryVector, vec));
            }
            return { id: doc.id, score: wl * l + ws * s };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score);

    return options.limit != null ? results.slice(0, options.limit) : results;
}
