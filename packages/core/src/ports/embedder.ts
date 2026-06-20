/**
 * Produces unit-length embedding vectors for semantic search. The concrete
 * implementation (`adapters/embedder-model2vec`) lazily downloads a small,
 * pure-JS static-embedding model. Mocked in tests.
 */
export interface Embedder {
    /** Whether the model is loaded and ready to embed. */
    readonly ready: boolean;
    /** Dimensionality of produced vectors. */
    readonly dimensions: number;
    /** Lazily load the model (downloads on first call). */
    load(): Promise<void>;
    /** Embed each text into a unit-length vector. */
    embed(texts: string[]): Promise<Float32Array[]>;
}
