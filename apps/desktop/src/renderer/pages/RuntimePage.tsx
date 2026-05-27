import { RuntimeDashboard, useRuntimeHealth } from "../runtime";

/** Runtime dashboard page — process manager health (Phase 56). */
export function RuntimePage() {
  const runtime = useRuntimeHealth();

  return (
    <div className="page-card runtime-page">
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
    </div>
  );
}
