import type {
  HermesPlanMessageData,
  HermesPlanningDetails,
} from "../types/hermes-plan";

export interface HermesPlanMessageProps {
  readonly data: HermesPlanMessageData;
}

/**
 * Renders Hermes structured planning output in chat (Phase 23).
 *
 * Goal, ordered steps, agent badge, and optional collapsible planning metadata.
 */
export function HermesPlanMessage({ data }: HermesPlanMessageProps) {
  const { plan, details } = data;

  return (
    <article
      className="hermes-plan-card"
      aria-label="Hermes structured plan"
      data-testid="hermes-plan-card"
    >
      <header className="hermes-plan-header">
        <span className="agent-badge hermes" data-testid="hermes-agent-badge">
          Hermes
        </span>
        <span className="hermes-plan-label">Structured plan</span>
      </header>

      <section className="hermes-plan-section" aria-labelledby="hermes-goal-heading">
        <h3 id="hermes-goal-heading" className="hermes-plan-section-title">
          Goal
        </h3>
        <p className="hermes-plan-goal" data-testid="hermes-plan-goal">
          {plan.goal}
        </p>
      </section>

      <section className="hermes-plan-section" aria-labelledby="hermes-steps-heading">
        <h3 id="hermes-steps-heading" className="hermes-plan-section-title">
          Steps
        </h3>
        <ol className="hermes-plan-steps" data-testid="hermes-plan-steps">
          {plan.steps.map((step, index) => (
            <li key={`${index}-${step.slice(0, 24)}`}>{step}</li>
          ))}
        </ol>
      </section>

      {details ? (
        <PlanningDetailsCollapsible details={details} />
      ) : null}
    </article>
  );
}

function PlanningDetailsCollapsible({
  details,
}: {
  readonly details: HermesPlanningDetails;
}) {
  return (
    <details className="hermes-plan-details" data-testid="hermes-planning-details">
      <summary>Planning Details</summary>
      <dl className="hermes-plan-details-list">
        {details.taskStatus ? (
          <>
            <dt>Task status</dt>
            <dd>{details.taskStatus}</dd>
          </>
        ) : null}
        {details.intentKind ? (
          <>
            <dt>Intent kind</dt>
            <dd>{details.intentKind}</dd>
          </>
        ) : null}
        {details.adapterId ? (
          <>
            <dt>Adapter</dt>
            <dd>{details.adapterId}</dd>
          </>
        ) : null}
        {details.stub !== undefined ? (
          <>
            <dt>Stub mode</dt>
            <dd>{details.stub ? "yes" : "no"}</dd>
          </>
        ) : null}
        {details.routingReason ? (
          <>
            <dt>Routing</dt>
            <dd>{details.routingReason}</dd>
          </>
        ) : null}
        {details.reasoningSummary ? (
          <>
            <dt>Reasoning</dt>
            <dd>{details.reasoningSummary}</dd>
          </>
        ) : null}
      </dl>
    </details>
  );
}
