import { STUB_EMBEDDING_VECTOR } from "../internal/mock-ids";
import type { EmbeddingProvider } from "./contract";

/** Legacy static embedding — test-only. */
export class EmbeddingProviderStub implements EmbeddingProvider {
  readonly componentId = "embedding-provider" as const;

  async embed(_text: string): Promise<readonly number[]> {
    return STUB_EMBEDDING_VECTOR;
  }
}
