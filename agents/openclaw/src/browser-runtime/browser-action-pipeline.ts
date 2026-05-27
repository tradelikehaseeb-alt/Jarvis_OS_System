import type { BrowserActionRequest } from "./browser-action-request";
import type {
  BrowserActionPipelineResult,
  BrowserActionResult,
} from "./browser-action-result";
import type { BrowserActionValidation } from "./browser-action-validator";

/**
 * Browser action execution pipeline contract (Phase 69).
 */
export interface BrowserActionPipeline {
  validateAction(request: BrowserActionRequest): Promise<BrowserActionValidation>;
  executeAction(request: BrowserActionRequest): Promise<BrowserActionResult>;
  executePipeline(
    requests: readonly BrowserActionRequest[],
  ): Promise<BrowserActionPipelineResult>;
}
