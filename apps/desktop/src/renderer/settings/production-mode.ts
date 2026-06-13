import type { ProviderStatus } from "../providers/provider-settings-types";

/**
 * True when Jarvis is running in real automation / production LLM mode
 * (not explicit stub-fallback test mode).
 */
export function isJarvisRealProductionMode(): boolean {
  const stubFallback = import.meta.env.VITE_JARVIS_ALLOW_LLM_STUB_FALLBACK;
  const browserReal = import.meta.env.VITE_JARVIS_BROWSER_REAL;
  if (browserReal === "true") {
    return true;
  }
  return stubFallback !== "true";
}

/** Hide stub badges when keys are configured or global real mode is active. */
export function isProviderProductionReady(provider: ProviderStatus): boolean {
  if (provider.kind === "stub") {
    return false;
  }
  if (provider.configured || provider.valid) {
    return true;
  }
  return isJarvisRealProductionMode();
}

export function resolveProviderStatusLabel(provider: ProviderStatus): string {
  if (isProviderProductionReady(provider)) {
    if (provider.active) {
      return "Active";
    }
    return "Real Production Mode";
  }
  if (provider.stub) {
    return "Stub fallback";
  }
  if (provider.valid) {
    return "Connected";
  }
  if (provider.configured) {
    return "Configured";
  }
  return "Not configured";
}

export function resolveProviderStatusClass(provider: ProviderStatus): string {
  if (isProviderProductionReady(provider)) {
    return provider.active
      ? "provider-status-production provider-status-active"
      : "provider-status-production";
  }
  return provider.valid ? "provider-status-ok" : "provider-status-stub";
}
