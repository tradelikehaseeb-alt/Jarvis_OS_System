import { useEffect, useState } from "react";

export interface HermesStartupStatusView {
  readonly connected: boolean;
  readonly label: string;
  readonly detail: string;
}

/**
 * Shows Hermes Python agent connection status on app startup.
 */
export function HermesConnectionBanner() {
  const [status, setStatus] = useState<HermesStartupStatusView | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = (await window.jarvis.getHermesStartupStatus()) as HermesStartupStatusView;
        if (!cancelled) {
          setStatus(result);
        }
      } catch {
        if (!cancelled) {
          setStatus({
            connected: false,
            label: "Hermes: Error ❌",
            detail: "Could not read Hermes status from main process",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!status) {
    return null;
  }

  return (
    <div
      className={`hermes-connection-banner${status.connected ? " hermes-connection-banner--ok" : " hermes-connection-banner--error"}`}
      data-testid="hermes-connection-banner"
      role="status"
      title={status.detail}
    >
      <span className="hermes-connection-banner__label">{status.label}</span>
      <span className="hermes-connection-banner__detail">{status.detail}</span>
    </div>
  );
}
