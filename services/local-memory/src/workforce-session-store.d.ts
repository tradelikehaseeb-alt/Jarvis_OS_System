import type { LocalMemoryRuntime } from "./local-memory-runtime";
export interface StoredWorkforceSession {
    readonly sessionId: string;
    readonly userId: string;
    readonly conversationId?: string;
    readonly workerTypes: readonly string[];
    readonly state: string;
    readonly sharedContextRef?: string;
    readonly updatedAt: string;
}
export declare function saveWorkforceSession(runtime: LocalMemoryRuntime, session: StoredWorkforceSession): StoredWorkforceSession;
export declare function loadWorkforceSession(runtime: LocalMemoryRuntime, userId: string, sessionId: string): StoredWorkforceSession | undefined;
export declare function listWorkforceSessions(runtime: LocalMemoryRuntime, userId: string): readonly StoredWorkforceSession[];
//# sourceMappingURL=workforce-session-store.d.ts.map