# Search

> Status: outline — expanded in Phase 6.

Hybrid search combines an always-on lexical layer with an opt-in semantic layer.

## Lexical (always on)
`uFuzzy` over an in-memory index of titles, URLs, notes, tags, and group/
workspace names. Instant; match highlighting. No model download.

## Semantic (opt-in, pure-JS, no WASM)
**Model2Vec** static embeddings (~8–30 MB, lazily downloaded + cached). Embedding
is tokenize → matrix lookup → mean-pool → normalize — no neural runtime. Per-tab
vectors are computed at save time (and lazily backfilled) from `title + url +
excerpt` and stored in an IndexedDB vector store; queries embed once and rank by
brute-force cosine.

## Hybrid ranking
Weighted combination of lexical score and semantic similarity. The ranking math
is pure (`core/search`); the model/tokenizer live behind `ports/embedder.ts` and
are mocked in tests.
