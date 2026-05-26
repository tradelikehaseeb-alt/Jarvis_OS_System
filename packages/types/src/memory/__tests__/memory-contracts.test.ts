import { describe, expect, it } from "vitest";
import type {
  MemoryProvider,
  MemoryQuery,
  MemoryRecord,
  MemorySearchResult,
  RetrievalRequest,
  RetrievalResponse,
} from "../index";

describe("Memory service contracts", () => {
  const record: MemoryRecord = {
    id: "mem-1",
    userId: "user-1",
    content: "User prefers dark mode",
    createdAt: "2026-05-25T00:00:00.000Z",
  };

  it("MemoryRecord shape", () => {
    expect(record.userId).toBe("user-1");
  });

  it("MemoryQuery shape", () => {
    const query: MemoryQuery = {
      userId: "user-1",
      query: "preferences",
      limit: 5,
    };
    expect(query.limit).toBe(5);
  });

  it("MemorySearchResult shape", () => {
    const hit: MemorySearchResult = { record, score: 0.9 };
    expect(hit.score).toBeLessThanOrEqual(1);
  });

  it("RetrievalRequest and RetrievalResponse pair", () => {
    const req: RetrievalRequest = {
      requestId: "ret-1",
      userId: "user-1",
      query: "preferences",
      topK: 3,
    };
    const res: RetrievalResponse = {
      requestId: req.requestId,
      results: [{ record, score: 0.8 }],
    };
    expect(res.results).toHaveLength(1);
  });

  it("MemoryProvider interface is structurally assignable", () => {
    const provider: MemoryProvider = {
      store: async () => record,
      get: async () => record,
      search: async () => [],
    };
    expect(await provider.get("mem-1", "user-1")).toEqual(record);
  });
});
