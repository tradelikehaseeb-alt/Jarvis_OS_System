export type ContinuousExecutionRole = "monitor" | "watch" | "background" | "scheduled";

export interface OpenClawContinuousRole {
  readonly role: ContinuousExecutionRole;
  readonly sandbox: boolean;
  readonly permissionsChecked: boolean;
}

/**
 * Maps OpenClaw execution to continuous background roles (Phase 99).
 */
export function resolveOpenClawContinuousRole(description: string): OpenClawContinuousRole {
  const lower = description.toLowerCase();
  if (/\b(monitor|alert)\b/i.test(lower)) {
    return { role: "monitor", sandbox: true, permissionsChecked: true };
  }
  if (/\b(watch|keep watching|news)\b/i.test(lower)) {
    return { role: "watch", sandbox: true, permissionsChecked: true };
  }
  if (/\b(every morning|daily briefing)\b/i.test(lower)) {
    return { role: "scheduled", sandbox: true, permissionsChecked: true };
  }
  return { role: "background", sandbox: true, permissionsChecked: true };
}
