import type {
  AggregatedRuntimeHealth,
  RuntimeComponentHealth,
} from "./aggregated-runtime-health-types";
import { DASHBOARD_COMPONENT_IDS } from "./aggregated-runtime-health-types";
import { RuntimeStatusBadge } from "./RuntimeStatusBadge";

export interface RuntimeHealthPanelProps {
  readonly health: AggregatedRuntimeHealth | null;
  readonly loading?: boolean;
  readonly error?: string | null;
}

function findComponent(
  components: readonly RuntimeComponentHealth[],
  componentId: (typeof DASHBOARD_COMPONENT_IDS)[number],
): RuntimeComponentHealth | undefined {
  return components.find((component) => component.componentId === componentId);
}

/**
 * Panel showing Hermes, OpenClaw, Speech, and Memory health (Phase 74).
 */
export function RuntimeHealthPanel({
  health,
  loading = false,
  error = null,
}: RuntimeHealthPanelProps) {
  const components = health?.components ?? [];

  return (
    <section
      className="runtime-health-panel"
      aria-label="Runtime component health"
      aria-busy={loading || undefined}
      data-testid="runtime-health-panel"
      data-status={health?.status ?? "unavailable"}
    >
      <header className="runtime-health-panel__header">
        <h3>Component Health</h3>
        {health ? (
          <span className="runtime-health-panel__summary">
            {health.healthyCount}/{health.totalCount} healthy
          </span>
        ) : null}
      </header>

      {loading && !health ? (
        <p data-testid="runtime-health-panel-loading">Loading component health…</p>
      ) : null}

      {error ? (
        <p className="runtime-health-panel__error" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="runtime-health-panel__list" data-testid="runtime-health-panel-list">
        {DASHBOARD_COMPONENT_IDS.map((componentId) => {
          const component = findComponent(components, componentId);
          return (
            <li
              key={componentId}
              className="runtime-health-panel__item"
              data-testid={`runtime-health-panel-${componentId}`}
            >
              <div className="runtime-health-panel__item-main">
                <strong>{component?.label ?? componentId}</strong>
                <RuntimeStatusBadge
                  label={component?.healthy ? "Healthy" : "Unhealthy"}
                  healthy={component?.healthy ?? false}
                  state={component?.state}
                  testId={`runtime-status-badge-${componentId}`}
                />
              </div>
              {component?.message ? (
                <span className="runtime-health-panel__message">{component.message}</span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {health ? (
        <p
          className="runtime-health-panel__recovery"
          data-testid="runtime-health-panel-recovery"
          data-recovery={health.recoveryState}
        >
          Recovery: {health.recoveryState}
        </p>
      ) : null}
    </section>
  );
}
