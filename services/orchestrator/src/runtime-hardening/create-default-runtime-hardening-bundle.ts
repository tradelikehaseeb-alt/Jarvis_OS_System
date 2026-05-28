import { createDefaultRuntimeStartupManager } from "../runtime-startup/create-default-runtime-startup-manager";
import type { RuntimeStartupManager } from "../runtime-startup/runtime-startup-manager";
import { createDefaultProviderHealthValidationRuntime } from "../llm-provider/provider-health/provider-health-validation-runtime";

import { PerformanceTelemetryRuntime } from "./performance-telemetry-runtime";
import { ProviderHealthMonitor } from "./provider-health-monitor";
import { RuntimeRecoveryManager } from "./runtime-recovery-manager";
import { SafeExecutionFallbackRuntime } from "./safe-execution-fallback-runtime";
import { SessionRestoreRuntime } from "./session-restore-runtime";

export interface RuntimeHardeningBundle {
  readonly recoveryManager: RuntimeRecoveryManager;
  readonly providerHealthMonitor: ProviderHealthMonitor;
  readonly safeExecutionFallback: SafeExecutionFallbackRuntime;
  readonly sessionRestore: SessionRestoreRuntime;
  readonly performanceTelemetry: PerformanceTelemetryRuntime;
}

export interface RuntimeHardeningBundleOptions {
  readonly startupManager?: RuntimeStartupManager;
  readonly sessionRestore?: SessionRestoreRuntime;
}

/**
 * Factory for Phase 94 runtime hardening bundle.
 */
export function createDefaultRuntimeHardeningBundle(
  options: RuntimeHardeningBundleOptions = {},
): RuntimeHardeningBundle {
  const startupManager =
    options.startupManager ?? createDefaultRuntimeStartupManager();
  const providerValidation = createDefaultProviderHealthValidationRuntime();

  return {
    recoveryManager: new RuntimeRecoveryManager(startupManager),
    providerHealthMonitor: new ProviderHealthMonitor(providerValidation),
    safeExecutionFallback: new SafeExecutionFallbackRuntime(),
    sessionRestore:
      options.sessionRestore ??
      new SessionRestoreRuntime(() => undefined),
    performanceTelemetry: new PerformanceTelemetryRuntime(),
  };
}
