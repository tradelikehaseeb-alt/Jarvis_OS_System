import type { TimelineStep } from "./timeline-step";

export interface TimelineStepProps {
  readonly step: TimelineStep;
}

/**
 * Single execution timeline step (Phase 75).
 */
export function TimelineStepComponent({ step }: TimelineStepProps) {
  return (
    <li
      className={`execution-timeline-step execution-timeline-step--${step.status}`}
      data-testid={`timeline-step-${step.kind}`}
      data-status={step.status}
    >
      <span className="execution-timeline-step__dot" aria-hidden />
      <div className="execution-timeline-step__content">
        <strong className="execution-timeline-step__label">{step.label}</strong>
        {step.message ? (
          <span className="execution-timeline-step__message">{step.message}</span>
        ) : null}
      </div>
    </li>
  );
}

/** Alias export matching phase naming. */
export const TimelineStep = TimelineStepComponent;
