import { useState } from "react";

export interface PipelineTelemetryPanelProps {
  readonly activeNode: string;
  readonly routingPath: string;
  readonly openClawCluster: string;
  readonly toolsets: readonly string[];
  readonly loading?: boolean;
}

/**
 * Collapsible multi-agent pipeline telemetry rail for the Jarvis OS command center.
 */
export function PipelineTelemetryPanel({
  activeNode,
  routingPath,
  openClawCluster,
  toolsets,
  loading = false,
}: PipelineTelemetryPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`cc-telemetry-panel cc-glass${collapsed ? " cc-telemetry-panel--collapsed" : ""}`}
      data-testid="pipeline-telemetry-panel"
      aria-label="Pipeline telemetry"
    >
      <header className="cc-telemetry-panel__header">
        <div className="cc-telemetry-panel__title-row">
          <span className="cc-telemetry-panel__pulse" aria-hidden />
          <h2 className="cc-telemetry-panel__title">Pipeline Telemetry</h2>
        </div>
        <button
          type="button"
          className="cc-telemetry-panel__toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand telemetry panel" : "Collapse telemetry panel"}
        >
          {collapsed ? "◀" : "▶"}
        </button>
      </header>

      {!collapsed ? (
        <div className="cc-telemetry-panel__body">
          <dl className="cc-telemetry-panel__metrics">
            <div className="cc-telemetry-panel__metric">
              <dt>Active Node</dt>
              <dd data-testid="telemetry-active-node">
                {loading ? <span className="cc-marquee-dot" aria-hidden /> : null}
                {activeNode}
              </dd>
            </div>
            <div className="cc-telemetry-panel__metric">
              <dt>Routing Path</dt>
              <dd data-testid="telemetry-routing-path">{routingPath}</dd>
            </div>
            <div className="cc-telemetry-panel__metric">
              <dt>OpenClaw Cluster</dt>
              <dd data-testid="telemetry-openclaw-cluster">{openClawCluster}</dd>
            </div>
          </dl>

          {toolsets.length > 0 ? (
            <div className="cc-telemetry-panel__toolsets">
              <span className="cc-telemetry-panel__toolsets-label">Toolsets</span>
              <div className="cc-telemetry-panel__badges">
                {toolsets.map((toolset) => (
                  <span
                    key={toolset}
                    className="cc-toolset-badge"
                    data-testid={`telemetry-toolset-${toolset}`}
                  >
                    [{toolset}]
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
