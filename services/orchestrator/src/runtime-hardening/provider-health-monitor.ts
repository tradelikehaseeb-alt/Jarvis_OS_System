import type {
  ProviderHealthCheckResult,
  ProviderConnectionStatus,
} from "../llm-provider/provider-health/provider-health-check-result";
import type { ProviderHealthValidationRuntime } from "../llm-provider/provider-health/provider-health-validation-runtime";

export interface ProviderHealthScore {
  readonly providerId: string;
  readonly score: number;
  readonly status: ProviderConnectionStatus;
  readonly latencyMs?: number;
  readonly checkedAt: string;
}

export interface ProviderHealthMonitorSnapshot {
  readonly scores: readonly ProviderHealthScore[];
  readonly bestProviderId?: string;
  readonly degraded: boolean;
  readonly checkedAt: string;
}

const STATUS_SCORE: Record<ProviderConnectionStatus, number> = {
  connected: 1,
  stub: 0.55,
  unreachable: 0.1,
  misconfigured: 0.05,
};

function scoreResult(result: ProviderHealthCheckResult): ProviderHealthScore {
  const base = STATUS_SCORE[result.connectionStatus] ?? 0.2;
  const latencyPenalty =
    typeof result.latencyMs === "number" && result.latencyMs > 1200 ? 0.15 : 0;
  return {
    providerId: result.providerId,
    score: Math.max(0, base - latencyPenalty),
    status: result.connectionStatus,
    latencyMs: result.latencyMs,
    checkedAt: result.checkedAt,
  };
}

/**
 * Continuous provider health scoring with cache (Phase 94).
 */
export class ProviderHealthMonitor {
  private snapshot: ProviderHealthMonitorSnapshot | undefined;
  private refreshPromise: Promise<ProviderHealthMonitorSnapshot> | undefined;

  constructor(
    private readonly validationRuntime: ProviderHealthValidationRuntime,
    private readonly cacheTtlMs = 30_000,
  ) {}

  getSnapshot(): ProviderHealthMonitorSnapshot | undefined {
    return this.snapshot;
  }

  async refresh(userId?: string): Promise<ProviderHealthMonitorSnapshot> {
    const now = Date.now();
    if (
      this.snapshot &&
      now - Date.parse(this.snapshot.checkedAt) < this.cacheTtlMs
    ) {
      return this.snapshot;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.runRefresh(userId).finally(() => {
      this.refreshPromise = undefined;
    });
    return this.refreshPromise;
  }

  private async runRefresh(userId?: string): Promise<ProviderHealthMonitorSnapshot> {
    const results = await this.validationRuntime.validateAllProviders(userId);
    const scores = results.map(scoreResult);
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const best = sorted.find((entry) => entry.score >= 0.5);

    this.snapshot = {
      scores,
      bestProviderId: best?.providerId,
      degraded: !best || best.status === "stub" || best.status === "unreachable",
      checkedAt: new Date().toISOString(),
    };

    return this.snapshot;
  }

  selectFallbackProvider(preferredId?: string): string | undefined {
    if (!this.snapshot) {
      return preferredId;
    }
    if (preferredId) {
      const preferred = this.snapshot.scores.find(
        (entry) => entry.providerId === preferredId,
      );
      if (preferred?.status === "connected" && preferred.score >= 0.5) {
        return preferredId;
      }
    }
    return this.snapshot.bestProviderId ?? preferredId;
  }
}
