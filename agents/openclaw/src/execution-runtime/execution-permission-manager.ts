export type ExecutionRiskLevel = "safe" | "moderate" | "risky";

export interface ExecutionPermissionRequest {
  readonly action: string;
  readonly url?: string;
  readonly selector?: string;
  readonly riskLevel?: ExecutionRiskLevel;
}

export interface ExecutionPermissionDecision {
  readonly allowed: boolean;
  readonly requiresConfirmation: boolean;
  readonly reason: string;
  readonly domain?: string;
}

export interface ExecutionPermissionManagerOptions {
  readonly allowedDomains?: readonly string[];
  readonly blockedDomains?: readonly string[];
  readonly autoApproveSafe?: boolean;
}

const DEFAULT_ALLOWED = [
  "mail.google.com",
  "gmail.com",
  "google.com",
  "localhost",
  "127.0.0.1",
  "stub.local",
] as const;

const RISKY_ACTIONS = new Set(["click-element", "type-text", "submit-form"]);

function extractDomain(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return undefined;
  }
}

/**
 * Validates execution permissions and domain restrictions (Phase 95).
 */
export class ExecutionPermissionManager {
  private readonly allowedDomains: readonly string[];
  private readonly blockedDomains: readonly string[];
  private readonly autoApproveSafe: boolean;

  constructor(options: ExecutionPermissionManagerOptions = {}) {
    this.allowedDomains = options.allowedDomains ?? DEFAULT_ALLOWED;
    this.blockedDomains = options.blockedDomains ?? [];
    this.autoApproveSafe = options.autoApproveSafe ?? true;
  }

  evaluate(request: ExecutionPermissionRequest): ExecutionPermissionDecision {
    const domain = extractDomain(request.url);
    const risk = request.riskLevel ?? this.inferRisk(request.action);

    if (domain && this.blockedDomains.some((blocked) => domain.includes(blocked))) {
      return {
        allowed: false,
        requiresConfirmation: false,
        reason: `Domain blocked: ${domain}`,
        domain,
      };
    }

    if (domain && !this.isDomainAllowed(domain)) {
      return {
        allowed: false,
        requiresConfirmation: true,
        reason: `External domain requires approval: ${domain}`,
        domain,
      };
    }

    if (risk === "risky") {
      return {
        allowed: true,
        requiresConfirmation: true,
        reason: "Risky action requires user confirmation",
        domain,
      };
    }

    return {
      allowed: true,
      requiresConfirmation: !this.autoApproveSafe && risk === "moderate",
      reason: this.autoApproveSafe ? "Auto-approved safe execution" : "Moderate action",
      domain,
    };
  }

  private inferRisk(action: string): ExecutionRiskLevel {
    if (RISKY_ACTIONS.has(action)) {
      return "risky";
    }
    if (action === "open-page" || action === "navigate" || action === "extract-content") {
      return "safe";
    }
    return "moderate";
  }

  private isDomainAllowed(domain: string): boolean {
    return this.allowedDomains.some(
      (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
    );
  }
}

export function createDefaultExecutionPermissionManager(
  options?: ExecutionPermissionManagerOptions,
): ExecutionPermissionManager {
  return new ExecutionPermissionManager(options);
}
