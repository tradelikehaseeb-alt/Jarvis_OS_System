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
  const update: BrowserPageContextUpdate = {
    lastAction: request.action,
  };

  switch (request.action) {
    case "open-page":
      update.currentUrl = request.url;
      update.title = `[stub-title:${request.url ?? "page"}]`;
      break;
    case "click-element":
      update.activeSelector = request.selector;
      break;
    case "type-text":
      update.activeSelector = request.selector;
      break;
    case "extract-content":
      update.activeSelector = request.selector;
      update.extractedContent = result.extractedContent;
      update.appendSnapshot = true;
      break;
  }

  return update;
}
