import { LOCAL_MEMORY_SCHEMA_VERSION } from "./file-local-memory-repository";
import { createDefaultSessionMemoryProfile, } from "./session-memory-profile";
const PROFILE_CONTENT_KEY = "sessionMemoryProfile";
function profileRecordId(userId, conversationId) {
    return `session-profile-${userId}-${conversationId ?? "global"}`;
}
function toRecord(profile) {
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
function fromRecord(record) {
    const payload = record.content[PROFILE_CONTENT_KEY];
    if (!payload || typeof payload !== "object") {
        return undefined;
    }
    return payload;
}
/**
 * Loads session memory profile from local memory (Phase 93).
 */
export function getSessionMemoryProfile(runtime, userId, conversationId) {
    const record = runtime.getMemory(profileRecordId(userId, conversationId));
    if (!record) {
        return undefined;
    }
    return fromRecord(record);
}
/**
 * Persists session memory profile (Phase 93).
 */
export function saveSessionMemoryProfile(runtime, profile) {
    runtime.saveMemory(toRecord(profile));
    return profile;
}
/**
 * Loads or creates a session memory profile (Phase 93).
 */
export function resolveSessionMemoryProfile(runtime, userId, conversationId) {
    return (getSessionMemoryProfile(runtime, userId, conversationId) ??
        createDefaultSessionMemoryProfile(userId, conversationId));
}
export { createDefaultSessionMemoryProfile };
