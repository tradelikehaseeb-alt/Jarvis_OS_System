import type { BrowserActionPipeline } from "./browser-action-pipeline";
import type { BrowserActionRequest } from "./browser-action-request";
import type {
  BrowserActionPipelineResult,
  BrowserActionResult,
} from "./browser-action-result";
import {
  DefaultBrowserActionValidator,
  type BrowserActionValidator,
} from "./browser-action-validator";
import { applyActionToPageContext } from "./apply-action-to-page-context";
import type { BrowserContextRuntime } from "./browser-context-runtime";
import { createDefaultBrowserContextRuntime } from "./create-default-browser-context-runtime";

export interface CreateDefaultBrowserActionPipelineOptions {
  readonly stub?: boolean;
  readonly validator?: BrowserActionValidator;
  readonly contextRuntime?: BrowserContextRuntime;
}

function nowIso(): string {
  return new Date().toISOString();
}

class DefaultBrowserActionPipeline implements BrowserActionPipeline {
  private readonly stub: boolean;
  private readonly contextRuntime: BrowserContextRuntime;

  constructor(
    private readonly validator: BrowserActionValidator,
    options: CreateDefaultBrowserActionPipelineOptions = {},
  ) {
    this.stub = options.stub ?? true;
    this.contextRuntime =
      options.contextRuntime ??
      createDefaultBrowserContextRuntime({ stub: this.stub });
  }

  validateAction(request: BrowserActionRequest) {
    return this.validator.validate(request);
  }

  async executeAction(
    request: BrowserActionRequest,
  ): Promise<BrowserActionResult> {
    const validation = await this.validateAction(request);
    const executedAt = nowIso();
    const stub = request.stub ?? this.stub;

    if (!validation.valid) {
      return {
        success: false,
        stub,
        action: request.action,
        status: "failed",
        message: validation.message,
        executedAt,
        url: request.url,
        selector: request.selector,
        text: request.text,
        screenshotRef: null,
      };
    }

    const message = this.stubMessage(request);

    const result: BrowserActionResult = {
      success: true,
      stub,
      action: request.action,
      status: "completed",
      message,
      executedAt,
      url: request.url,
      selector: request.selector,
      text: request.text,
      extractedContent:
        request.action === "extract-content"
          ? `[stub-content:${request.selector ?? request.url ?? "page"}]`
          : undefined,
      screenshotRef: null,
    };

    if (this.contextRuntime.getCurrentContext()) {
      await this.contextRuntime.updateContext(
        applyActionToPageContext(request, result),
      );
    }

    return result;
  }

  async executePipeline(
    requests: readonly BrowserActionRequest[],
  ): Promise<BrowserActionPipelineResult> {
    const executedAt = nowIso();
    const results: BrowserActionResult[] = [];

    if (requests.length > 0 && !this.contextRuntime.getCurrentContext()) {
      await this.contextRuntime.initializeContext(requests[0]!.taskId);
    }

    for (const request of requests) {
      const result = await this.executeAction(request);
      results.push(result);
      if (!result.success) {
        return {
          success: false,
          stub: request.stub ?? this.stub,
          results,
          executedAt,
          message: `Pipeline failed at ${request.action}: ${result.message}`,
        };
      }
    }

    const stub = requests.every((request) => request.stub ?? this.stub);

    return {
      success: true,
      stub,
      results,
      executedAt,
      message:
        results.length === 0
          ? "Pipeline completed with no actions"
          : `Pipeline stub-executed ${results.length} action(s) (no real browsing)`,
    };
  }

  private stubMessage(request: BrowserActionRequest): string {
    switch (request.action) {
      case "open-page":
        return `Stub open-page stub-executed for ${request.url ?? "page"} (no real browsing)`;
      case "click-element":
        return `Stub click-element stub-executed on ${request.selector} (no real browsing)`;
      case "type-text":
        return `Stub type-text stub-executed on ${request.selector} (no real browsing)`;
      case "extract-content":
        return `Stub extract-content stub-executed from ${request.selector ?? request.url ?? "page"} (no real browsing)`;
    }
  }
}

/**
 * Factory for default browser action pipeline — stub path only (Phase 69).
 */
export function createDefaultBrowserActionPipeline(
  options?: CreateDefaultBrowserActionPipelineOptions,
): BrowserActionPipeline {
  return new DefaultBrowserActionPipeline(
    options?.validator ?? new DefaultBrowserActionValidator(),
    options,
  );
}
