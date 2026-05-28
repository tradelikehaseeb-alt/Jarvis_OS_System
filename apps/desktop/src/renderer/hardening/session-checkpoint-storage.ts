import type { ChatMessage } from "../components/ChatMessages";

export const CRASH_RECOVERY_FLAG_KEY = "jarvis.desktop.crashRecoveryPending";
export const SESSION_CHECKPOINT_PREFIX = "jarvis.desktop.sessionCheckpoint.";

export interface SessionCheckpointPayload {
  readonly sessionId: string;
  readonly conversationId: string;
  readonly pendingTaskId?: string;
  readonly messages: readonly { readonly role: string; readonly text: string }[];
  readonly savedAt: string;
}

export function markCrashRecoveryPending(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(CRASH_RECOVERY_FLAG_KEY, new Date().toISOString());
}

export function clearCrashRecoveryPending(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.removeItem(CRASH_RECOVERY_FLAG_KEY);
}

export function readCrashRecoveryPending(): string | undefined {
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  return localStorage.getItem(CRASH_RECOVERY_FLAG_KEY) ?? undefined;
}

export function saveSessionCheckpoint(payload: SessionCheckpointPayload): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(
    `${SESSION_CHECKPOINT_PREFIX}${payload.sessionId}`,
    JSON.stringify(payload),
  );
}

export function loadSessionCheckpoint(
  sessionId: string,
): SessionCheckpointPayload | undefined {
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  try {
    const raw = localStorage.getItem(`${SESSION_CHECKPOINT_PREFIX}${sessionId}`);
    if (!raw) {
      return undefined;
    }
    return JSON.parse(raw) as SessionCheckpointPayload;
  } catch {
    return undefined;
  }
}

export function messagesToCheckpoint(
  sessionId: string,
  conversationId: string,
  messages: readonly ChatMessage[],
  pendingTaskId?: string,
): SessionCheckpointPayload {
  return {
    sessionId,
    conversationId,
    pendingTaskId,
    messages: messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({ role: message.role, text: message.text })),
    savedAt: new Date().toISOString(),
  };
}
