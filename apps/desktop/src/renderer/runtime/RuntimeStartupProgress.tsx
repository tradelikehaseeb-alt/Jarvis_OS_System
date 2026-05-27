import type { RuntimeStartupProgress } from "./aggregated-runtime-health-types";

export interface RuntimeStartupProgressProps {
  readonly progress: RuntimeStartupProgress | null;
  readonly loading?: boolean;
}

function phaseLabel(phase: RuntimeStartupProgress["phase"]): string {
  switch (phase) {
    case "ready":
      return "Ready";
    case "bootstrapping":
      return "Bootstrapping";
    case "validating":
      return "Validating";
    case "recovering":
      return "Recovering";
    case "degraded":
      return "Degraded";
    case "failed":
      return "Failed";
    default:
      return "Idle";
  }
}

/**
 * Startup progress indicator for runtime bootstrap flow (Phase 74).
 */
export function RuntimeStartupProgress({
  progress,
  loading = false,
}: RuntimeStartupProgressProps) {
  const percent = progress?.percent ?? 0;
  const phase = progress?.phase ?? "idle";

  return (
    <section
      className="runtime-startup-progress"
      aria-label="Runtime startup progress"
      aria-busy={loading || undefined}
      data-testid="runtime-startup-progress"
      data-phase={phase}
    >
      <header className="runtime-startup-progress__header">
        <h3>Startup Progress</h3>
        <span data-testid="runtime-startup-progress-label">{phaseLabel(phase)}</span>
      </header>

      <div
        className="runtime-startup-progress__bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid="runtime-startup-progress-bar"
      >
        <div
          className="runtime-startup-progress__fill"
          style={{ width: `${percent}%` }}
          data-testid="runtime-startup-progress-fill"
        />
      </div>

      {progress?.message ? (
        <p className="runtime-startup-progress__message">{progress.message}</p>
      ) : null}
    </section>
  );
}
