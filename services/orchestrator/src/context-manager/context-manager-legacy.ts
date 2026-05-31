import type {
  ContextManager,
  ContextManagerCreateInput,
  OrchestratorContext,
} from "./contract";
import { MOCK_TIMESTAMP, mockContextRef } from "../internal/mock-ids";

/** Legacy in-memory context stub — test-only. */
export class ContextManagerStub implements ContextManager {
  readonly componentId = "context-manager" as const;

  private readonly store = new Map<string, OrchestratorContext>();

  async create(input: ContextManagerCreateInput): Promise<OrchestratorContext> {
    const context: OrchestratorContext = {
      contextRef: mockContextRef(input.task.id),
      taskId: input.task.id,
      userId: input.task.userId,
      createdAt: MOCK_TIMESTAMP,
      conversationId: `conv-${input.task.userId}`,
      messages: [],
      userProfile: { name: "Haseeb Rasheed" },
      estimatedTokens: 0,
      withinTokenLimit: true,
    };
    this.store.set(context.contextRef, context);
    return context;
  }

  async get(contextRef: string): Promise<OrchestratorContext | undefined> {
    return this.store.get(contextRef);
  }
}
