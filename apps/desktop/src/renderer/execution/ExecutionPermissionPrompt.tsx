import { memo } from "react";

import type { ExecutionPermissionView } from "./execution-runtime-types";

export interface ExecutionPermissionPromptProps {
  readonly permission?: ExecutionPermissionView;
  readonly onApprove?: () => void;
  readonly onDeny?: () => void;
}

/**
 * Minimal permission prompt for risky execution actions (Phase 95).
 */
export const ExecutionPermissionPrompt = memo(function ExecutionPermissionPrompt({
  permission,
  onApprove,
  onDeny,
}: ExecutionPermissionPromptProps) {
  if (!permission?.required) {
    return null;
  }

  return (
    <div
      className="execution-permission-prompt"
      data-testid="execution-permission-prompt"
      role="dialog"
      aria-label="Execution permission"
    >
      <p className="execution-permission-prompt__message">
        {permission.message ?? "Allow Jarvis to continue?"}
        {permission.domain ? ` (${permission.domain})` : null}
      </p>
      <div className="execution-permission-prompt__actions">
        <button type="button" className="btn btn--ghost" onClick={onDeny}>
          Deny
        </button>
        <button type="button" className="btn btn--primary" onClick={onApprove}>
          Allow
        </button>
      </div>
    </div>
  );
});
