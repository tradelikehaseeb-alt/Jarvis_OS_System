import type { BrowserWorkflowStep } from "../browser-runtime/browser-workflow-step";

const URL_HINTS: Readonly<Record<string, string>> = {
  gmail: "https://mail.google.com",
  "google mail": "https://mail.google.com",
  outlook: "https://outlook.live.com",
  youtube: "https://www.youtube.com",
  tradingview: "https://www.tradingview.com",
  github: "https://github.com",
};

const STUB_FALLBACK_URL = "https://stub.local/task";

export interface BrowserIntentRuntimeResult {
  readonly success: boolean;
  readonly stub: boolean;
  readonly action: string;
  readonly url: string;
  readonly status: "completed" | "failed" | "validated";
  readonly message: string;
  readonly executedAt: string;
  readonly screenshotRef?: string | null;
  readonly nativeOpen: boolean;
  readonly browserState?: {
    readonly sessionId: string;
    readonly url: string;
    readonly active: boolean;
    readonly stub: boolean;
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function extractExplicitUrl(description: string): string | undefined {
  const urlMatch = description.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    return urlMatch[0]!;
  }
  const domainMatch = description.match(
    /\b([a-z0-9-]+\.(?:com|org|net|io|dev|local))\b/i,
  );
  if (domainMatch) {
    return `https://${domainMatch[1]}`;
  }
  return undefined;
}

function extractSearchQuery(description: string): string | undefined {
  const match = description.match(/\bsearch(?:\s+for)?\s+(.+)/i);
  return match?.[1]?.trim();
}

function resolveHintUrl(description: string): string | undefined {
  const lower = description.toLowerCase();
  for (const [hint, url] of Object.entries(URL_HINTS)) {
    if (lower.includes(hint)) {
      return url;
    }
  }
  return undefined;
}

function isCloseWindowIntent(description: string): boolean {
  const lower = description.toLowerCase();
  return (
    /\bexit\s+window\b/.test(lower) ||
    /\bshutdown\b/.test(lower) ||
    /\bclose\b/.test(lower)
  );
}

function isSimpleOpenIntent(description: string): boolean {
  const lower = description.toLowerCase();
  return (
    lower.includes("youtube") ||
    /\b(open|play)\b/.test(lower) ||
    /\bgo to\b/.test(lower) ||
    /\bnavigate\b/.test(lower)
  );
}

/**
 * True when the URL is a real http(s) target (not the OpenClaw stub placeholder).
 */
export function isResolvableBrowserUrl(url: string): boolean {
  if (!url || url.includes("stub.local")) {
    return false;
  }

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Builds a successful runtime result for native OS browser actions (Playwright fallback).
 */
export function buildNativeBrowserRuntimeResult(
  url: string,
  action: string,
): BrowserIntentRuntimeResult | undefined {
  if (action === "close_window") {
    const executedAt = nowIso();
    return {
      success: true,
      stub: false,
      action,
      url: "",
      status: "completed",
      message: "Prepared native browser close_window action",
      executedAt,
      screenshotRef: null,
      nativeOpen: true,
      browserState: {
        sessionId: `native-browser-${executedAt}`,
        url: "",
        active: false,
        stub: false,
      },
    };
  }

  if (!isResolvableBrowserUrl(url)) {
    return undefined;
  }

  const executedAt = nowIso();
  return {
    success: true,
    stub: false,
    action,
    url,
    status: "completed",
    message: `Prepared native browser open for ${url}`,
    executedAt,
    screenshotRef: null,
    nativeOpen: true,
    browserState: {
      sessionId: `native-browser-${executedAt}`,
      url,
      active: true,
      stub: false,
    },
  };
}

function resolveBrowserAction(
  description: string,
  workflowSteps: readonly BrowserWorkflowStep[],
): string {
  if (isCloseWindowIntent(description)) {
    return "close_window";
  }

  const lower = description.toLowerCase();
  if (lower.includes("youtube") && workflowSteps.length === 1) {
    return "open";
  }

  if (workflowSteps.length > 1) {
    return "workflow";
  }

  if (isSimpleOpenIntent(description)) {
    return "open";
  }

  return "navigate";
}

/**
 * Derives browser URL, workflow steps, and optional native runtime result from intent (Phase 95).
 */
export function parseBrowserIntent(description: string): {
  readonly url: string;
  readonly action: string;
  readonly workflowSteps: readonly BrowserWorkflowStep[];
  readonly runtimeResult?: BrowserIntentRuntimeResult;
} {
  const lower = description.toLowerCase();

  if (isCloseWindowIntent(description)) {
    const action = "close_window";
    const runtimeResult = buildNativeBrowserRuntimeResult("", action);
    return {
      url: "",
      action,
      workflowSteps: [],
      ...(runtimeResult ? { runtimeResult } : {}),
    };
  }

  const url =
    extractExplicitUrl(description) ??
    resolveHintUrl(description) ??
    STUB_FALLBACK_URL;

  const workflowSteps: BrowserWorkflowStep[] = [
    {
      action: "open-page",
      url,
    },
  ];

  if (
    lower.includes("summarize") ||
    lower.includes("extract") ||
    lower.includes("read") ||
    lower.includes("check")
  ) {
    workflowSteps.push({
      action: "extract-content",
      url,
      selector: "body",
    });
  }

  if (lower.includes("click") || lower.includes("select")) {
    workflowSteps.push({
      action: "click-element",
      selector: "[data-jarvis-target]",
    });
  }

  if (lower.includes("prepare") || lower.includes("workspace")) {
    workflowSteps.push({
      action: "click-element",
      selector: "[data-jarvis-workspace]",
    });
  }

  const searchQuery = extractSearchQuery(description);
  if (searchQuery) {
    workflowSteps.push({
      action: "type-text",
      selector: "input[name=search_query], input#search, input[type=search], input[name=q]",
      text: searchQuery,
    });
    workflowSteps.push({
      action: "click-element",
      selector: "button#search-icon-legacy, button[aria-label='Search'], input[type=submit]",
    });
  } else if (lower.includes("type") || lower.includes("fill") || lower.includes("enter")) {
    workflowSteps.push({
      action: "type-text",
      selector: "input",
      text: "[voice-input]",
    });
  }

  const action = resolveBrowserAction(description, workflowSteps);
  const runtimeResult = buildNativeBrowserRuntimeResult(url, action);

  return {
    url,
    action,
    workflowSteps,
    ...(runtimeResult ? { runtimeResult } : {}),
  };
}

export function buildWorkflowProgressMessage(
  stepIndex: number,
  totalSteps: number,
  action: string,
): string {
  return `Step ${stepIndex + 1}/${totalSteps}: ${action.replace("-", " ")} · ${nowIso()}`;
}
