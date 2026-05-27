import {
  RuntimeDashboard,
  RuntimeStartupPanel,
  useRuntimeHealth,
  useRuntimeStartup,
} from "../runtime";
import { RuntimeActionPanel, useRuntimeActions } from "../runtime-actions";

/** Runtime dashboard page — process manager health and controls (Phase 56–57, 73). */
export function RuntimePage() {
  const startup = useRuntimeStartup({ autoSync: false });
  const runtime = useRuntimeHealth({ enabled: startup.ready });
  const actions = useRuntimeActions({
    onActionComplete: () => {
      void runtime.refresh();
      void startup.refresh();
    },
  });

  return (
    <div className="page-card runtime-page">
      <RuntimeStartupPanel
        status={startup.status}
        events={startup.events}
        loading={startup.loading}
        error={startup.error}
        onRecover={() => {
          void startup.recoverRuntime();
        }}
        onRefresh={() => {
          void startup.refresh();
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
