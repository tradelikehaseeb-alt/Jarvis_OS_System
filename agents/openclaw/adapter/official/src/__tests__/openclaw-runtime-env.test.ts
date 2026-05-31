import { describe, expect, it } from "vitest";

import {
  DEFAULT_OPENCLAW_LOCAL_ENDPOINT,
  readOpenClawRuntimeEnv,
} from "../openclaw-runtime-env";

describe("readOpenClawRuntimeEnv", () => {
  it("defaults to stub and not configured", () => {
    const env = readOpenClawRuntimeEnv({});
    expect(env.mode).toBe("stub");
    expect(env.configured).toBe(false);
  });

  it("configures local mode with default gateway endpoint", () => {
    const env = readOpenClawRuntimeEnv({ OPENCLAW_MODE: "local" });
    expect(env.configured).toBe(true);
    expect(env.endpoint).toBe(DEFAULT_OPENCLAW_LOCAL_ENDPOINT);
  });

  it("honors OPENCLAW_ENDPOINT override", () => {
    const env = readOpenClawRuntimeEnv({
      OPENCLAW_MODE: "official",
      OPENCLAW_ENDPOINT: "http://localhost:18789",
    });
    expect(env.endpoint).toBe("http://localhost:18789");
    expect(env.configured).toBe(true);
  });

  it("falls back to OPENCLAW_GATEWAY_URL when endpoint unset", () => {
    const env = readOpenClawRuntimeEnv({
      OPENCLAW_MODE: "local",
      OPENCLAW_GATEWAY_URL: "http://localhost:8010",
    });
    expect(env.endpoint).toBe("http://localhost:8010");
    expect(env.configured).toBe(true);
  });
});
