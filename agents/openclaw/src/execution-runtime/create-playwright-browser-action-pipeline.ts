import { createRequire } from "node:module";
import path from "node:path";

import type { BrowserActionPipeline } from "../browser-runtime/browser-action-pipeline";
import type { BrowserActionRequest } from "../browser-runtime/browser-action-request";
import type {
  BrowserActionPipelineResult,
  BrowserActionResult,
} from "../browser-runtime/browser-action-result";
import type { BrowserContextRuntime } from "../browser-runtime/browser-context-runtime";
import { applyActionToPageContext } from "../browser-runtime/apply-action-to-page-context";
import {
  DefaultBrowserActionValidator,
  type BrowserActionValidator,
} from "../browser-runtime/browser-action-validator";
import { createDefaultBrowserContextRuntime } from "../browser-runtime/create-default-browser-context-runtime";

export interface PlaywrightPageLike {
  goto(url: string, options?: { timeout?: number }): Promise<unknown>;
  click(selector: string, options?: { timeout?: number }): Promise<void>;
  fill(selector: string, value: string, options?: { timeout?: number }): Promise<void>;
  textContent(selector: string): Promise<string | null>;
  title(): Promise<string>;
  url(): string;
  screenshot(options?: { type?: string }): Promise<Buffer>;
}

export interface PlaywrightBrowserActionPipelineOptions {
  readonly page: PlaywrightPageLike;
  readonly validator?: BrowserActionValidator;
  readonly contextRuntime?: BrowserContextRuntime;
  readonly actionTimeoutMs?: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Playwright-backed browser action pipeline with stub fallback on failure (Phase 95).
 */
export class PlaywrightBrowserActionPipeline implements BrowserActionPipeline {
  private readonly page: PlaywrightPageLike;
  private readonly validator: BrowserActionValidator;
  private readonly contextRuntime: BrowserContextRuntime;
  private readonly actionTimeoutMs: number;

  constructor(options: PlaywrightBrowserActionPipelineOptions) {
    this.page = options.page;
    this.validator = options.validator ?? new DefaultBrowserActionValidator();
    this.contextRuntime =
      options.contextRuntime ??
      createDefaultBrowserContextRuntime({ stub: false });
    this.actionTimeoutMs = options.actionTimeoutMs ?? 15_000;
  }

  validateAction(request: BrowserActionRequest) {
    return this.validator.validate(request);
  }

  async executeAction(request: BrowserActionRequest): Promise<BrowserActionResult> {
    const validation = await this.validateAction(request);
    const executedAt = nowIso();

    if (!validation.valid) {
      return {
        success: false,
        stub: false,
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

    try {
      const result = await this.runPlaywrightAction(request, executedAt);
      if (this.contextRuntime.getCurrentContext()) {
        await this.contextRuntime.updateContext(
          applyActionToPageContext(request, result),
        );
      }
      return result;
    } catch (error) {
      return {
        success: false,
        stub: false,
        action: request.action,
        status: "failed",
        message: error instanceof Error ? error.message : "Browser action failed",
        executedAt,
        url: request.url,
        selector: request.selector,
        text: request.text,
        screenshotRef: null,
      };
    }
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
          stub: false,
          results,
          executedAt,
          message: `Pipeline failed at ${request.action}: ${result.message}`,
        };
      }
    }

    return {
      success: true,
      stub: false,
      results,
      executedAt,
      message: `Executed ${results.length} browser action(s)`,
    };
  }

  private async runPlaywrightAction(
    request: BrowserActionRequest,
    executedAt: string,
  ): Promise<BrowserActionResult> {
    const timeout = this.actionTimeoutMs;

    switch (request.action) {
      case "open-page": {
        const url = request.url ?? "about:blank";
        await this.page.goto(url, { timeout });
        return {
          success: true,
          stub: false,
          action: request.action,
          status: "completed",
          message: `Opened ${url}`,
          executedAt,
          url: this.page.url(),
          screenshotRef: null,
        };
      }
      case "click-element": {
        const selector = request.selector ?? "body";
        await this.page.click(selector, { timeout });
        return {
          success: true,
          stub: false,
          action: request.action,
          status: "completed",
          message: `Clicked ${selector}`,
          executedAt,
          url: this.page.url(),
          selector,
          screenshotRef: null,
        };
      }
      case "type-text": {
        const selector = request.selector ?? "input";
        const text = request.text ?? "";
        await this.page.fill(selector, text, { timeout });
        return {
          success: true,
          stub: false,
          action: request.action,
          status: "completed",
          message: `Typed into ${selector}`,
          executedAt,
          url: this.page.url(),
          selector,
          text,
          screenshotRef: null,
        };
      }
      case "extract-content": {
        const selector = request.selector ?? "body";
        const content = (await this.page.textContent(selector)) ?? "";
        return {
          success: true,
          stub: false,
          action: request.action,
          status: "completed",
          message: `Extracted content from ${selector}`,
          executedAt,
          url: this.page.url(),
          selector,
          extractedContent: content.slice(0, 4000),
          screenshotRef: null,
        };
      }
      default:
        throw new Error(`Unsupported browser action: ${request.action}`);
    }
  }
}

export function createPlaywrightBrowserActionPipeline(
  options: PlaywrightBrowserActionPipelineOptions,
): BrowserActionPipeline {
  return new PlaywrightBrowserActionPipeline(options);
}

function loadPlaywrightModule(): {
  chromium: { launch: (options: { headless: boolean }) => Promise<{
    newPage: () => Promise<PlaywrightPageLike>;
  }> };
} {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  return require("playwright") as {
    chromium: { launch: (options: { headless: boolean }) => Promise<{
      newPage: () => Promise<PlaywrightPageLike>;
    }> };
  };
}

/**
 * Attempts to launch Playwright Chromium; returns null when unavailable (Phase 95).
 */
export async function tryLaunchPlaywrightPage(): Promise<PlaywrightPageLike | null> {
  try {
    const playwright = loadPlaywrightModule();
    const headless = process.env.JARVIS_BROWSER_HEADLESS !== "false";
    const browser = await playwright.chromium.launch({ headless });
    const page = await browser.newPage();
    const pageLike: PlaywrightPageLike = {
      goto: (url, options) => page.goto(url, options),
      click: (selector, options) => page.click(selector, options),
      fill: (selector, value, options) => page.fill(selector, value, options),
      textContent: (selector) => page.textContent(selector),
      title: () => page.title(),
      url: () => page.url(),
      screenshot: (options) => page.screenshot(options),
    };
    return pageLike;
  } catch {
    return null;
  }
}
