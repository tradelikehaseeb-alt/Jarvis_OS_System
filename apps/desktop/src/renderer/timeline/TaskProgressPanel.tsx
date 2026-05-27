import { ExecutionTimeline } from "./ExecutionTimeline";
import type { TimelineStep } from "./timeline-step";

export interface TaskProgressPanelProps {
  readonly steps: readonly TimelineStep[];
  readonly progress: number;
  readonly loading?: boolean;
}

/**
 * Task progress panel with live execution timeline (Phase 75).
 */
export function TaskProgressPanel({
  steps,
  progress,
  loading = false,
}: TaskProgressPanelProps) {
  return (
    <section
      className="task-progress-panel"
      aria-label="Task progress"
      aria-busy={loading || undefined}
      data-testid="task-progress-panel"
    >
      <header className="task-progress-panel__header">
        <h2>Task Progress</h2>
        <span
          className="task-progress-panel__percent"
          data-testid="task-progress-percent"
        >
          {progress}%
        </span>
      </header>

      <div
        className="task-progress-panel__bar"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid="task-progress-bar"
      >
        <div
          className="task-progress-panel__fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ExecutionTimeline steps={steps} loading={loading} />
    </section>
  );
}
