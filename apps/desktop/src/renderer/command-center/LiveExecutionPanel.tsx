import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { ActivityEvent } from "../activity/activity-event";
import type { TimelineStep } from "../timeline/timeline-step";

import { DynamicActivityPanel } from "./DynamicActivityPanel";
import { JARVIS_EXECUTION_LABELS } from "./execution-display-labels";
import { fadeSlideUp, panelTransition } from "../polish/motion-presets";
import { MemoryContextIndicator } from "../memory/MemoryContextIndicator";
import { BrowserStateIndicator } from "../execution/BrowserStateIndicator";
import { ExecutionPermissionPrompt } from "../execution/ExecutionPermissionPrompt";
import type { BrowserStateView, ExecutionPermissionView } from "../execution/execution-runtime-types";
import { WorkforceActivityPanel } from "../workforce/WorkforceActivityPanel";
import type { WorkforceActivityViewState } from "../workforce/workforce-types";

export interface LiveExecutionPanelProps {
  readonly steps: readonly TimelineStep[];
  readonly progress: number;
  readonly events: readonly ActivityEvent[];
  readonly loading?: boolean;
  readonly displayMessage?: string;
  readonly error?: string;
  readonly providerLabel?: string;
  readonly latencyMs?: number;
  readonly memoryRecallMessage?: string;
  readonly memoryRecallCount?: number;
  readonly browserState?: BrowserStateView;
  readonly permission?: ExecutionPermissionView;
  readonly onApprovePermission?: () => void;
  readonly onDenyPermission?: () => void;
  readonly onCancelExecution?: () => void;
  readonly cancelled?: boolean;
  readonly workforce?: WorkforceActivityViewState;
  readonly workforceVisible?: boolean;
  readonly workforceDisplayLabel?: string;
}

/**
 * Real-time execution progress rail with polished transitions (Phase 89 / 92).
 */
export const LiveExecutionPanel = memo(function LiveExecutionPanel({
  steps,
  progress,
  events,
  loading = false,
  displayMessage,
  error,
  providerLabel,
  latencyMs,
  memoryRecallMessage,
  memoryRecallCount,
  browserState,
  permission,
  onApprovePermission,
  onDenyPermission,
  onCancelExecution,
  cancelled = false,
  workforce,
  workforceVisible = false,
  workforceDisplayLabel,
}: LiveExecutionPanelProps) {
  const showPanel = loading || steps.length > 0 || Boolean(error) || events.length > 0;
  const complete = !loading && !error && progress >= 1;

  return (
    <AnimatePresence>
      {showPanel ? (
        <motion.section
          className="live-execution-panel"
          aria-label="Execution progress"
          data-testid="live-execution-panel agent-status-panel"
          aria-busy={loading || undefined}
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={panelTransition}
        >
          <header className="live-execution-panel__header">
            <h2>{complete ? JARVIS_EXECUTION_LABELS.taskComplete : JARVIS_EXECUTION_LABELS.inProgress}</h2>
            {providerLabel ? (
              <span className="live-execution-panel__provider" data-testid="live-provider-indicator">
                {providerLabel}
                {typeof latencyMs === "number" ? ` · ${latencyMs}ms` : null}
              </span>
            ) : null}
          </header>

          {displayMessage ? (
            <p className="live-execution-panel__status" data-testid="agent-status-thinking">
              {loading ? <span className="spinner spinner--subtle" aria-hidden /> : null}
              {displayMessage}
            </p>
          ) : null}

          <MemoryContextIndicator
            visible={Boolean(memoryRecallMessage)}
            message={memoryRecallMessage}
            snippetCount={memoryRecallCount}
          />

          <BrowserStateIndicator browserState={browserState} />

          <ExecutionPermissionPrompt
            permission={permission}
            onApprove={onApprovePermission}
            onDeny={onDenyPermission}
          />

          {loading && onCancelExecution ? (
            <button
              type="button"
              className="live-execution-panel__cancel btn btn--ghost"
              data-testid="execution-cancel-button"
              onClick={onCancelExecution}
            >
              Stop execution
            </button>
          ) : null}

          {cancelled ? (
            <p className="live-execution-panel__hint" data-testid="execution-cancelled">
              Execution stopped
            </p>
          ) : null}

          <DynamicActivityPanel events={events} loading={loading} />

          <WorkforceActivityPanel
            visible={workforceVisible}
            workforce={workforce}
            loading={loading}
            displayLabel={workforceDisplayLabel}
          />

          <div
            className="live-execution-panel__progress"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            data-testid="task-progress-panel"
          >
            <motion.div
              className="live-execution-panel__progress-fill"
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={panelTransition}
            />
          </div>

          {steps.length > 0 ? (
            <ol className="live-execution-panel__steps" data-testid="execution-timeline">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className={`live-execution-step live-execution-step--${step.status}`}
                  data-testid={`timeline-step-${step.kind}`}
                >
                  {step.label}
                </li>
              ))}
            </ol>
          ) : null}

          {error ? (
            <p className="live-execution-panel__error" role="alert" data-testid="agent-status-error">
              {error}
            </p>
          ) : loading ? (
            <p className="live-execution-panel__hint">{JARVIS_EXECUTION_LABELS.streaming}</p>
          ) : complete ? (
            <p className="live-execution-panel__complete">{JARVIS_EXECUTION_LABELS.taskComplete}</p>
          ) : null}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
});
