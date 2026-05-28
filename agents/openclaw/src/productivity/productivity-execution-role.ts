export type ProductivityExecutionRole =
  | "email"
  | "scheduling"
  | "research"
  | "workspace"
  | "general";

export interface OpenClawProductivityRole {
  readonly role: ProductivityExecutionRole;
  readonly sandbox: boolean;
  readonly permissionsChecked: boolean;
}

/**
 * Maps OpenClaw execution to productivity roles without exposing internals (Phase 98).
 */
export function resolveOpenClawProductivityRole(description: string): OpenClawProductivityRole {
  const lower = description.toLowerCase();
  if (/\b(email|inbox|unread)\b/i.test(lower)) {
    return { role: "email", sandbox: true, permissionsChecked: true };
  }
  if (/\b(schedule|calendar|meeting)\b/i.test(lower)) {
    return { role: "scheduling", sandbox: true, permissionsChecked: true };
  }
  if (/\b(workspace|trading|browser|open)\b/i.test(lower)) {
    return { role: "workspace", sandbox: true, permissionsChecked: true };
  }
  if (/\b(research|brief|news)\b/i.test(lower)) {
    return { role: "research", sandbox: true, permissionsChecked: true };
  }
  return { role: "general", sandbox: true, permissionsChecked: true };
}
