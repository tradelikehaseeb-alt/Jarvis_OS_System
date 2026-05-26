import type {
  ContextManager,
  ContextManagerCreateInput,
  OrchestratorContext,
} from "./contract";
import { MOCK_TIMESTAMP, mockContextRef } from "../internal/mock-ids";

/**
 * In-memory context store for stub wiring (not Jarvis Memory Service).
 */
export class ContextManagerStub implements ContextManager {
  readonly componentId = "context-manager" as const;

  private readonly store = new Map<string, OrchestratorContext>();

  async create(input: ContextManagerCreateInput): Promise<OrchestratorContext> {
    const context: OrchestratorContext = {
      contextRef: mockContextRef(input.task.id),
      taskId: input.task.id,
      userId: input.task.userId,
      createdAt: MOCK_TIMESTAMP,
    };
    this.store.set(context.contextRef, context);
    return context;
  }

  async get(contextRef: string): Promise<OrchestratorContext | undefined> {
    return this.store.get(contextRef);
  }
}
