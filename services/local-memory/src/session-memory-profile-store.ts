import type { LocalMemoryRecord } from "./local-memory-record";
import type { LocalMemoryRuntime } from "./local-memory-runtime";
import { LOCAL_MEMORY_SCHEMA_VERSION } from "./file-local-memory-repository";
import {
  createDefaultSessionMemoryProfile,
  type SessionMemoryProfile,
} from "./session-memory-profile";

const PROFILE_CONTENT_KEY = "sessionMemoryProfile" as const;

function profileRecordId(userId: string, conversationId?: string): string {
  return `session-profile-${userId}-${conversationId ?? "global"}`;
}

function toRecord(profile: SessionMemoryProfile): LocalMemoryRecord {
  return {
    recordId: profileRecordId(profile.userId, profile.conversationId),
    type: "session-profile",
    userId: profile.userId,
    timestamp: profile.updatedAt,
    conversationId: profile.conversationId,
    sessionId: profile.sessionId,
    content: { [PROFILE_CONTENT_KEY]: profile },
    schemaVersion: LOCAL_MEMORY_SCHEMA_VERSION,
  };
}

function fromRecord(record: LocalMemoryRecord): SessionMemoryProfile | undefined {
  const payload = record.content[PROFILE_CONTENT_KEY];
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  return payload as SessionMemoryProfile;
}

/**
 * Loads session memory profile from local memory (Phase 93).
 */
export function getSessionMemoryProfile(
  runtime: LocalMemoryRuntime,
  userId: string,
  conversationId?: string,
): SessionMemoryProfile | undefined {
  const record = runtime.getMemory(profileRecordId(userId, conversationId));
  if (!record) {
    return undefined;
  }
  return fromRecord(record);
}

/**
 * Persists session memory profile (Phase 93).
 */
export function saveSessionMemoryProfile(
  runtime: LocalMemoryRuntime,
  profile: SessionMemoryProfile,
): SessionMemoryProfile {
  runtime.saveMemory(toRecord(profile));
  return profile;
}

/**
 * Loads or creates a session memory profile (Phase 93).
 */
export function resolveSessionMemoryProfile(
  runtime: LocalMemoryRuntime,
  userId: string,
  conversationId?: string,
): SessionMemoryProfile {
  return (
    getSessionMemoryProfile(runtime, userId, conversationId) ??
    createDefaultSessionMemoryProfile(userId, conversationId)
  );
}

export { createDefaultSessionMemoryProfile, type SessionMemoryProfile };
