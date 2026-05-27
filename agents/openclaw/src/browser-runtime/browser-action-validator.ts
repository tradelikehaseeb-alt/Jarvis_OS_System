import { BROWSER_STUB_ACTIONS, type BrowserAction } from "./browser-action";
import type { BrowserActionRequest } from "./browser-action-request";

/**
 * Action validation snapshot (Phase 69).
 */
export interface BrowserActionValidation {
  readonly valid: boolean;
  readonly action: BrowserAction;
  readonly message: string;
  readonly checkedAt: string;
}

/**
 * Validates browser action requests before execution (Phase 69).
 */
export interface BrowserActionValidator {
  validate(request: BrowserActionRequest): Promise<BrowserActionValidation>;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Default stub action validator — no real browser automation (Phase 69).
 */
export class DefaultBrowserActionValidator implements BrowserActionValidator {
  async validate(request: BrowserActionRequest): Promise<BrowserActionValidation> {
    const checkedAt = nowIso();

    if (!BROWSER_STUB_ACTIONS.includes(request.action)) {
      return {
        valid: false,
        action: request.action,
        message: `Unsupported browser action: ${request.action}`,
        checkedAt,
      };
    }

    if (request.action === "open-page" && !request.url) {
      return {
        valid: false,
        action: request.action,
        message: "open-page requires url",
        checkedAt,
      };
    }

    if (
      (request.action === "click-element" || request.action === "type-text") &&
      !request.selector
    ) {
      return {
        valid: false,
        action: request.action,
        message: `${request.action} requires selector`,
        checkedAt,
      };
    }

    if (request.action === "type-text" && !request.text) {
      return {
        valid: false,
        action: request.action,
        message: "type-text requires text",
        checkedAt,
      };
    }

    return {
      valid: true,
      action: request.action,
      message: `Browser action ${request.action} validated (stub path)`,
      checkedAt,
    };
  }
}
