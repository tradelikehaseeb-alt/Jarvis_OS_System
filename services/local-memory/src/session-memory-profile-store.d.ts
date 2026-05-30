import type { LocalMemoryRuntime } from "./local-memory-runtime";
import { createDefaultSessionMemoryProfile, type SessionMemoryProfile } from "./session-memory-profile";
/**
 * Loads session memory profile from local memory (Phase 93).
 */
export declare function getSessionMemoryProfile(runtime: LocalMemoryRuntime, userId: string, conversationId?: string): SessionMemoryProfile | undefined;
/**
 * Persists session memory profile (Phase 93).
 */
export declare function saveSessionMemoryProfile(runtime: LocalMemoryRuntime, profile: SessionMemoryProfile): SessionMemoryProfile;
/**
 * Loads or creates a session memory profile (Phase 93).
 */
export declare function resolveSessionMemoryProfile(runtime: LocalMemoryRuntime, userId: string, conversationId?: string): SessionMemoryProfile;
export { createDefaultSessionMemoryProfile, type SessionMemoryProfile };
//# sourceMappingURL=session-memory-profile-store.d.ts.map