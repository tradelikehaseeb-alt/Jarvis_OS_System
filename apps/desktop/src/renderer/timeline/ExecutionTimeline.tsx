import type { TimelineStep } from "./timeline-step";
import { TimelineStep as TimelineStepItem } from "./TimelineStep";

export interface ExecutionTimelineProps {
  readonly steps: readonly TimelineStep[];
  readonly loading?: boolean;
}

/**
 * Live execution timeline from planning through completion (Phase 75).
 */
export function ExecutionTimeline({ steps, loading = false }: ExecutionTimelineProps) {
  if (steps.length === 0 && !loading) {
    return (
      <p className="execution-timeline-empty" data-testid="execution-timeline-empty">
        Task progress will appear here while Jarvis executes.
      </p>
    );
  }

  return (
    <ol
      className="execution-timeline"
      data-testid="execution-timeline"
      aria-busy={loading || undefined}
    >
      {steps.map((step) => (
        <TimelineStepItem key={step.id} step={step} />
      ))}
      {loading ? (
        <li
          className="execution-timeline-step execution-timeline-step--active"
          data-testid="execution-timeline-loading"
        >
          <span className="execution-timeline-step__dot" aria-hidden />
          <div className="execution-timeline-step__content">
            <span className="spinner" aria-hidden />
            <span>Jarvis is working…</span>
          </div>
        </li>
      ) : null}
    </ol>
  );
}
