import type { BrowserActionRequest } from "./browser-action-request";
import type { BrowserActionResult } from "./browser-action-result";
import type { BrowserPageContextUpdate } from "./browser-page-context";

/**
 * Derives page context updates from stub action execution (Phase 70).
 */
export function applyActionToPageContext(
  request: BrowserActionRequest,
  result: BrowserActionResult,
): BrowserPageContextUpdate {
  switch (request.action) {
    case "open-page":
      return {
        lastAction: request.action,
        currentUrl: request.url,
        title: `[stub-title:${request.url ?? "page"}]`,
      };
    case "click-element":
      return {
        lastAction: request.action,
        activeSelector: request.selector,
      };
    case "type-text":
      return {
        lastAction: request.action,
        activeSelector: request.selector,
      };
    case "extract-content":
      return {
        lastAction: request.action,
        activeSelector: request.selector,
        extractedContent: result.extractedContent,
        appendSnapshot: true,
      };
    default:
      return { lastAction: request.action };
  }
}
