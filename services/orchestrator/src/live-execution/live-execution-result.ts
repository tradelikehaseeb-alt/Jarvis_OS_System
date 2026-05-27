import type { ProviderStatus } from "../llm-provider";
import type { JarvisExecutionFlowResult } from "../e2e/jarvis-execution-flow-result";

import type { LiveExecutionSession } from "./live-execution-session";

/** Result of {@link LiveExecutionRuntime.executeLiveTask} (Phase 84). */
export interface LiveExecutionResult {
  readonly session: LiveExecutionSession;
  readonly command: string;
  readonly flowResult: JarvisExecutionFlowResult;
  readonly providerStatus: ProviderStatus;
  readonly success: boolean;
  readonly stub: boolean;
  readonly timelineEventCount: number;
  readonly workspaceResponse?: string;
}
