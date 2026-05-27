import type { BrowserRuntimeConfig } from "./browser-runtime-config";
import type { BrowserRuntimeHealth } from "./browser-runtime-health";

/**
 * Validates browser runtime readiness before session creation (Phase 68).
 */
export interface BrowserRuntimeValidator {
  validate(config: BrowserRuntimeConfig): Promise<BrowserRuntimeHealth>;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Default stub validator — no real browser automation (Phase 68).
 */
export class DefaultBrowserRuntimeValidator implements BrowserRuntimeValidator {
  async validate(config: BrowserRuntimeConfig): Promise<BrowserRuntimeHealth> {
    const stub = config.stub ?? true;
    const checkedAt = nowIso();

    return {
      valid: true,
      stub,
      available: true,
      message: stub
        ? "Browser runtime bootstrap validated (stub fallback, no real automation)"
        : "Browser runtime bootstrap validated (connection path only)",
      checkedAt,
    };
  }
}
