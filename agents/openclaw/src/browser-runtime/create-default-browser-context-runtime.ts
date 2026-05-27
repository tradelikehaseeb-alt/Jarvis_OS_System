import type { BrowserPageContext, BrowserPageContextUpdate } from "./browser-page-context";
import type { BrowserPageSnapshot } from "./browser-page-snapshot";
import type { BrowserContextRuntime } from "./browser-context-runtime";
import type { BrowserSessionState } from "./browser-session-state";

export interface CreateDefaultBrowserContextRuntimeOptions {
  readonly stub?: boolean;
}

let contextCounter = 0;
let snapshotCounter = 0;

function nextContextId(): string {
  contextCounter += 1;
  return `page-context-${contextCounter}`;
}

function nextSnapshotId(): string {
  snapshotCounter += 1;
  return `page-snapshot-${snapshotCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

class DefaultBrowserContextRuntime implements BrowserContextRuntime {
  private context: BrowserPageContext | undefined;
  private readonly stub: boolean;

  constructor(options: CreateDefaultBrowserContextRuntimeOptions = {}) {
    this.stub = options.stub ?? true;
  }

  async initializeContext(sessionId: string): Promise<BrowserPageContext> {
    const updatedAt = nowIso();

    this.context = {
      contextId: nextContextId(),
      sessionId,
      state: "initialized",
      stub: this.stub,
      actionCount: 0,
      snapshots: [],
      updatedAt,
    };

    return this.context;
  }

  async updateContext(update: BrowserPageContextUpdate): Promise<BrowserPageContext> {
    if (!this.context) {
      throw new Error("Browser page context is not initialized");
    }

    const updatedAt = nowIso();
    const snapshots = [...this.context.snapshots];

    if (update.appendSnapshot ?? update.extractedContent !== undefined) {
      const snapshot: BrowserPageSnapshot = {
        snapshotId: nextSnapshotId(),
        url: update.currentUrl ?? this.context.currentUrl,
        title: update.title ?? this.context.title,
        activeSelector: update.activeSelector ?? this.context.activeSelector,
        extractedContent: update.extractedContent,
        capturedAt: updatedAt,
      };
      snapshots.push(snapshot);
    }

    this.context = {
      ...this.context,
      state: "active",
      currentUrl: update.currentUrl ?? this.context.currentUrl,
      title: update.title ?? this.context.title,
      activeSelector: update.activeSelector ?? this.context.activeSelector,
      lastAction: update.lastAction ?? this.context.lastAction,
      actionCount:
        update.lastAction !== undefined
          ? this.context.actionCount + 1
          : this.context.actionCount,
      snapshots,
      updatedAt,
    };

    return this.context;
  }

  getCurrentContext(): BrowserPageContext | undefined {
    return this.context;
  }

  async clearContext(): Promise<void> {
    if (!this.context) {
      return;
    }

    this.context = {
      ...this.context,
      state: "cleared" as BrowserSessionState,
      currentUrl: undefined,
      title: undefined,
      activeSelector: undefined,
      lastAction: undefined,
      actionCount: 0,
      snapshots: [],
      updatedAt: nowIso(),
    };
    this.context = undefined;
  }
}

/**
 * Factory for default stub page context runtime (Phase 70).
 */
export function createDefaultBrowserContextRuntime(
  options?: CreateDefaultBrowserContextRuntimeOptions,
): BrowserContextRuntime {
  return new DefaultBrowserContextRuntime(options);
}
