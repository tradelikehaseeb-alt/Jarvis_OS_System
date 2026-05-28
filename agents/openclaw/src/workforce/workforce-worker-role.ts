export type WorkforceWorkerType =
  | "research"
  | "browser"
  | "coding"
  | "market"
  | "scheduling"
  | "document"
  | "communication";

export interface OpenClawWorkforceRole {
  readonly workerType: WorkforceWorkerType | "execution";
  readonly sandbox: boolean;
  readonly permissionsChecked: boolean;
}

/**
 * Maps OpenClaw execution to workforce worker roles without exposing internals (Phase 97).
 */
export function resolveOpenClawWorkforceRole(description: string): OpenClawWorkforceRole {
  const lower = description.toLowerCase();
  if (/\b(open|browse|navigate|website)\b/i.test(lower)) {
    return { workerType: "browser", sandbox: true, permissionsChecked: true };
  }
  if (/\b(code|implement|build|fix)\b/i.test(lower)) {
    return { workerType: "coding", sandbox: true, permissionsChecked: true };
  }
  return { workerType: "execution", sandbox: true, permissionsChecked: true };
}
