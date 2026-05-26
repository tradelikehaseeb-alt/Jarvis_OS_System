import { afterEach, describe, expect, it, vi } from "vitest";

import {
  normalizeHttpEndpoint,
  safeEndpointProbe,
} from "../safe-endpoint-probe";

describe("normalizeHttpEndpoint", () => {
  it("adds http scheme when missing", () => {
    expect(normalizeHttpEndpoint("127.0.0.1:8080")).toBe(
      "http://127.0.0.1:8080",
    );
  });

  it("rejects non-http schemes", () => {
    expect(normalizeHttpEndpoint("stub://127.0.0.1")).toBeUndefined();
  });
});

describe("safeEndpointProbe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips network when allowNetwork is false", async () => {
    const result = await safeEndpointProbe("http://127.0.0.1:9", {
      allowNetwork: false,
    });
    expect(result.probe).toBe("skipped");
    expect(result.reachable).toBe(false);
  });

  it("reports reachable on successful HEAD", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );

    const result = await safeEndpointProbe("http://127.0.0.1:8080");
    expect(result.reachable).toBe(true);
    expect(result.probe).toBe("head");
    expect(result.statusCode).toBe(200);
  });

  it("falls back to GET when HEAD returns 405", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 405 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await safeEndpointProbe("http://127.0.0.1:18789");
    expect(result.reachable).toBe(true);
    expect(result.probe).toBe("get");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
