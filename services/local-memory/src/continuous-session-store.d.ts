import type { LocalMemoryRuntime } from "./local-memory-runtime";
export interface StoredContinuousSession {
    readonly sessionId: string;
    readonly userId: string;
    readonly conversationId?: string;
    readonly presence: string;
    readonly backgroundTaskCount: number;
    readonly state: string;
    readonly updatedAt: string;
}
export declare function saveContinuousSession(runtime: LocalMemoryRuntime, session: StoredContinuousSession): StoredContinuousSession;
export declare function loadContinuousSession(runtime: LocalMemoryRuntime, userId: string, sessionId: string): StoredContinuousSession | undefined;
export declare function listContinuousSessions(runtime: LocalMemoryRuntime, userId: string): readonly StoredContinuousSession[];
//# sourceMappingURL=continuous-session-store.d.ts.map