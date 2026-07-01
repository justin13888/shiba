# Search

## Today: lexical

Two lexical layers exist:

- **Saved-view filter** — the tab list filters live on a case-insensitive substring
  match over each tab's title and URL (`ui/saved/match.ts`), with a real
  "no results" state.
- **Ranking math (pure)** — `core/search` provides `lexicalScore`/`lexicalSearch`
  (weighted substring/token scoring) and `hybridSearch`, which normalizes a lexical
  score and optionally blends a semantic cosine similarity. It is fully unit-tested
  and independent of any model.

The ranking math is not yet wired into the saved-view filter (which uses the simpler
substring matcher); doing so is a small follow-up.

## Roadmap (not yet built)

The pieces below were described in earlier design notes but do **not** exist in code:

- **`uFuzzy`** fuzzy matching + match highlighting (the lexical layer is hand-rolled
  substring scoring today).
- **Semantic search** via Model2Vec static embeddings, an IndexedDB vector store,
  save-time vectorization, and brute-force cosine ranking. `ports/embedder.ts`
  defines the contract, but there is **no embedder adapter** and no vector store.
  `hybridSearch` already accepts a query vector + per-tab vectors, so wiring an
  embedder is the remaining work.
