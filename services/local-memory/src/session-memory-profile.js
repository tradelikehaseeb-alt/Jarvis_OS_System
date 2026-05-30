export function createDefaultSessionMemoryProfile(userId, conversationId) {
    const now = new Date().toISOString();
    return {
        profileId: `profile-${userId}-${conversationId ?? "global"}-${Date.now()}`,
        userId,
        conversationId,
        recentInteractionIds: [],
        topicKeywords: [],
        recallWeights: {},
        updatedAt: now,
    };
}
