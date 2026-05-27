/**
 * Supported browser action kinds (Phase 69). Stub path only — no real automation.
 */
export type BrowserAction =
  | "open-page"
  | "click-element"
  | "type-text"
  | "extract-content";

/** All stub-supported browser actions. */
export const BROWSER_STUB_ACTIONS: readonly BrowserAction[] = [
  "open-page",
  "click-element",
  "type-text",
  "extract-content",
] as const;

/**
 * Maps legacy execution action names to pipeline actions (Phase 69).
 */
export function resolveBrowserAction(action: string): BrowserAction | undefined {
  if (BROWSER_STUB_ACTIONS.includes(action as BrowserAction)) {
    return action as BrowserAction;
  }
  if (action === "navigate") {
    return "open-page";
  }
  return undefined;
}
