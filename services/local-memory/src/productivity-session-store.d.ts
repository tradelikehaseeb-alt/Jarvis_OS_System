import type { LocalMemoryRuntime } from "./local-memory-runtime";
export interface StoredProductivitySession {
    readonly sessionId: string;
    readonly userId: string;
    readonly conversationId?: string;
    readonly focus?: string;
    readonly taskCount: number;
    readonly state: string;
    readonly updatedAt: string;
}
export declare function saveProductivitySession(runtime: LocalMemoryRuntime, session: StoredProductivitySession): StoredProductivitySession;
export declare function loadProductivitySession(runtime: LocalMemoryRuntime, userId: string, sessionId: string): StoredProductivitySession | undefined;
export declare function listProductivitySessions(runtime: LocalMemoryRuntime, userId: string): readonly StoredProductivitySession[];
//# sourceMappingURL=productivity-session-store.d.ts.map