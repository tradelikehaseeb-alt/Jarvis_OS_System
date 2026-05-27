import {
  RuntimeDashboard,
  RuntimeHealthPanel,
  RuntimeStartupPanel,
  RuntimeStartupProgress,
  useRuntimeHealth,
  useRuntimeStartup,
} from "../runtime";
import { RuntimeActionPanel, useRuntimeActions } from "../runtime-actions";

/**
 * Full runtime health dashboard page (Phase 74).
 */
export function RuntimeDashboardPage() {
  const startup = useRuntimeStartup({ autoSync: true });
  const runtime = useRuntimeHealth({ enabled: true });
  const actions = useRuntimeActions({
    onActionComplete: () => {
      void runtime.refresh();
      void startup.refresh();
    },
  });

  return (
    <div className="page-card runtime-dashboard-page" data-testid="runtime-dashboard-page">
      <header className="runtime-dashboard-page__header">
        <h1>Runtime Dashboard</h1>
        <p>Live Jarvis runtime state — startup, health, and recovery</p>
      </header>

      <RuntimeStartupProgress
        progress={runtime.startupProgress}
        loading={startup.loading || runtime.loading}
      />

      <RuntimeHealthPanel
        health={runtime.aggregated}
        loading={runtime.loading}
        error={runtime.error}
      />

      <RuntimeStartupPanel
        status={startup.status}
        events={startup.events}
        loading={startup.loading}
        error={startup.error}
        onRecover={() => {
          void startup.recoverRuntime().then(() => runtime.refresh());
        }}
        onRefresh={() => {
          void startup.refresh();
          void runtime.refresh();
        }}
      />

      <RuntimeDashboard
        statuses={runtime.statuses}
        health={runtime.health}
        events={runtime.events}
        loading={runtime.loading}
        error={runtime.error}
        onRefresh={() => {
          void runtime.refresh();
        }}
      />

      <RuntimeActionPanel statuses={runtime.statuses} actions={actions} />
    </div>
  );
}

/** @deprecated Use {@link RuntimeDashboardPage} — kept for backward compatibility. */
export const RuntimePage = RuntimeDashboardPage;
