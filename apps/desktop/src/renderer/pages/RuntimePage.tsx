import { RuntimeDashboard, useRuntimeHealth } from "../runtime";
import { RuntimeActionPanel, useRuntimeActions } from "../runtime-actions";

/** Runtime dashboard page — process manager health and controls (Phase 56–57). */
export function RuntimePage() {
  const runtime = useRuntimeHealth();
  const actions = useRuntimeActions({
    onActionComplete: () => {
      void runtime.refresh();
    },
  });

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
      <RuntimeActionPanel statuses={runtime.statuses} actions={actions} />
    </div>
  );
}
