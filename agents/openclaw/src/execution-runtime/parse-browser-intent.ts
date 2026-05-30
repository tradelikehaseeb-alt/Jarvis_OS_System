import type { BrowserWorkflowStep } from "../browser-runtime/browser-workflow-step";

const URL_HINTS: Readonly<Record<string, string>> = {
  gmail: "https://mail.google.com",
  "google mail": "https://mail.google.com",
  outlook: "https://outlook.live.com",
  youtube: "https://www.youtube.com",
  tradingview: "https://www.tradingview.com",
  github: "https://github.com",
};

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
  if (/\bopen\b/.test(lower) || /\bnavigate\b/.test(lower) || /\bgo to\b/.test(lower)) {
    return "https://stub.local/task";
  }
  return undefined;
}

/**
 * Derives browser URL and workflow steps from natural-language intent (Phase 95).
 */
export function parseBrowserIntent(description: string): {
  readonly url: string;
  readonly action: string;
  readonly workflowSteps: readonly BrowserWorkflowStep[];
} {
  const url = extractExplicitUrl(description) ?? resolveHintUrl(description) ?? "https://stub.local/task";
  const lower = description.toLowerCase();

  const workflowSteps: BrowserWorkflowStep[] = [
    {
      action: "open-page",
      url,
    },
  ];

  if (lower.includes("summarize") || lower.includes("extract") || lower.includes("read") || lower.includes("check")) {
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

  return {
    url,
    action: workflowSteps.length > 1 ? "workflow" : "navigate",
    workflowSteps,
  };
}

export function buildWorkflowProgressMessage(
  stepIndex: number,
  totalSteps: number,
  action: string,
): string {
  return `Step ${stepIndex + 1}/${totalSteps}: ${action.replace("-", " ")} · ${nowIso()}`;
}
