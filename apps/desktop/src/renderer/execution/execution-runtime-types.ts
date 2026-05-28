export interface BrowserStateView {
  readonly sessionId: string;
  readonly url: string;
  readonly title?: string;
  readonly active: boolean;
  readonly stub: boolean;
  readonly stepIndex?: number;
  readonly totalSteps?: number;
}

export interface ExecutionPermissionView {
  readonly required: boolean;
  readonly message?: string;
  readonly domain?: string;
}

export interface ExecutionRuntimeView {
  readonly browserState?: BrowserStateView;
  readonly permission?: ExecutionPermissionView;
  readonly workflowProgress?: readonly string[];
}
