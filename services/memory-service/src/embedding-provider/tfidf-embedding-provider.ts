import type { EmbeddingProvider } from "./contract";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function termFrequency(tokens: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  const max = Math.max(...counts.values(), 1);
  const tf = new Map<string, number>();
  for (const [token, count] of counts) {
    tf.set(token, count / max);
  }
  return tf;
}

function vectorFromTf(
  tf: Map<string, number>,
  vocabulary: readonly string[],
): number[] {
  return vocabulary.map((term) => tf.get(term) ?? 0);
}

function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const av = a[index] ?? 0;
    const bv = b[index] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Local TF-IDF relevance scoring — no external embedding API.
 */
export class TfidfEmbeddingProvider implements EmbeddingProvider {
  readonly componentId = "embedding-provider" as const;

  private readonly corpusTokens: string[] = [];

  async embed(text: string): Promise<readonly number[]> {
    const tokens = tokenize(text);
    this.corpusTokens.push(...tokens);
    const vocabulary = [...new Set(this.corpusTokens)].slice(0, 512);
    const tf = termFrequency(tokens);
    return vectorFromTf(tf, vocabulary);
  }

  /**
   * Scores documents against a query using cosine similarity over TF vectors.
   */
  scoreDocuments(
    query: string,
    documents: readonly { readonly id: string; readonly text: string }[],
  ): Array<{ readonly id: string; readonly score: number }> {
    const queryTokens = tokenize(query);
    const vocabulary = [
      ...new Set([
        ...queryTokens,
        ...documents.flatMap((doc) => tokenize(doc.text)),
      ]),
    ].slice(0, 512);

    const queryVector = vectorFromTf(termFrequency(queryTokens), vocabulary);

    return documents
      .map((doc) => {
        const docVector = vectorFromTf(termFrequency(tokenize(doc.text)), vocabulary);
        return {
          id: doc.id,
          score: cosineSimilarity(queryVector, docVector),
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}
