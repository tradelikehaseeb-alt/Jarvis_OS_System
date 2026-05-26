import { describe, expect, it } from "vitest";

import {
  DEFAULT_HERMES_LOCAL_ENDPOINT,
  readHermesRuntimeEnv,
} from "../hermes-runtime-env";

describe("readHermesRuntimeEnv", () => {
  it("defaults to stub and not configured", () => {
    const env = readHermesRuntimeEnv({});
    expect(env.mode).toBe("stub");
    expect(env.configured).toBe(false);
    expect(env.endpoint).toBe("");
  });

  it("configures local mode with default endpoint", () => {
    const env = readHermesRuntimeEnv({ HERMES_MODE: "local" });
    expect(env.configured).toBe(true);
    expect(env.endpoint).toBe(DEFAULT_HERMES_LOCAL_ENDPOINT);
  });

  it("uses explicit endpoint when provided", () => {
    const env = readHermesRuntimeEnv({
      HERMES_MODE: "official",
      HERMES_ENDPOINT: "http://localhost:9001",
    });
    expect(env.configured).toBe(true);
    expect(env.endpoint).toBe("http://localhost:9001");
  });

  it("does not configure stub mode even with endpoint", () => {
    const env = readHermesRuntimeEnv({
      HERMES_MODE: "stub",
      HERMES_ENDPOINT: "http://localhost:9001",
    });
    expect(env.configured).toBe(false);
  });
});
