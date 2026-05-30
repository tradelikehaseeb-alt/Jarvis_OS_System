/**
 * Per-user session memory profile for adaptive recall weighting (Phase 93).
 */
export interface SessionMemoryProfile {
    readonly profileId: string;
    readonly userId: string;
    readonly conversationId?: string;
    readonly sessionId?: string;
    /** Recent task or turn ids used to boost continuity. */
    readonly recentInteractionIds: readonly string[];
    /** Topic keywords extracted from recent turns. */
    readonly topicKeywords: readonly string[];
    /** Adaptive rule weight overrides (ruleId → multiplier). */
    readonly recallWeights: Readonly<Record<string, number>>;
    readonly lastRecallAt?: string;
    readonly updatedAt: string;
}
export declare function createDefaultSessionMemoryProfile(userId: string, conversationId?: string): SessionMemoryProfile;
//# sourceMappingURL=session-memory-profile.d.ts.map