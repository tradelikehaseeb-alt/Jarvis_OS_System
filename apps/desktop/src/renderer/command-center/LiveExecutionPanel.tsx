import type { ActivityEvent } from "../activity/activity-event";
import type { TimelineStep } from "../timeline/timeline-step";

import { DynamicActivityPanel } from "./DynamicActivityPanel";
import { JARVIS_EXECUTION_LABELS } from "./execution-display-labels";

export interface LiveExecutionPanelProps {
  readonly steps: readonly TimelineStep[];
  readonly progress: number;
  readonly events: readonly ActivityEvent[];
  readonly loading?: boolean;
  readonly displayMessage?: string;
  readonly error?: string;
  readonly providerLabel?: string;
  readonly latencyMs?: number;
}

/**
 * Real-time execution progress rail (Phase 89).
 */
export function LiveExecutionPanel({
  steps,
  progress,
  events,
  loading = false,
  displayMessage,
  error,
  providerLabel,
  latencyMs,
}: LiveExecutionPanelProps) {
  const showPanel = loading || steps.length > 0 || Boolean(error) || events.length > 0;

  if (!showPanel) {
    return null;
  }

  return (
    <section
      className="live-execution-panel"
      aria-label="Execution progress"
      data-testid="live-execution-panel agent-status-panel"
      aria-busy={loading || undefined}
    >
      <header className="live-execution-panel__header">
        <h2>Execution</h2>
        {providerLabel ? (
          <span className="live-execution-panel__provider" data-testid="live-provider-indicator">
            {providerLabel}
            {typeof latencyMs === "number" ? ` · ${latencyMs}ms` : null}
          </span>
        ) : null}
      </header>

      {displayMessage ? (
        <p className="live-execution-panel__status" data-testid="agent-status-thinking">
          {loading ? <span className="spinner" aria-hidden /> : null}
          {displayMessage}
        </p>
      ) : null}

      <DynamicActivityPanel events={events} loading={loading} />

      <div
        className="live-execution-panel__progress"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid="task-progress-panel"
      >
        <div
          className="live-execution-panel__progress-fill"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {steps.length > 0 ? (
        <ol className="live-execution-panel__steps" data-testid="execution-timeline">
          {steps.map((step) => (
            <li
              key={step.id}
              className={`live-execution-step live-execution-step--${step.status}`}
              data-testid={`timeline-step-${step.kind}`}
            >
              {step.label}
            </li>
          ))}
        </ol>
      ) : null}

      {error ? (
        <p className="live-execution-panel__error" role="alert" data-testid="agent-status-error">
          {error}
        </p>
      ) : loading ? (
        <p className="live-execution-panel__hint">{JARVIS_EXECUTION_LABELS.streaming}</p>
      ) : null}
    </section>
  );
}
