import {
  createDefaultLocalMemoryRuntime,
  type LocalMemoryRuntime,
} from "@jarvis/local-memory";
import {
  getSharedJarvisMemoryClient,
  type JarvisMemoryClient,
} from "@jarvis/memory-service";
import type { MemoryStore } from "../memory/memory-store";
import type { ConversationMemory } from "../memory/conversation-memory";

import { createDefaultConversationHistoryRuntime } from "../conversation-history/create-default-conversation-history-runtime";
import type { ConversationHistoryRuntime } from "../conversation-history/conversation-history-runtime";
import {
  ORCHESTRATOR_CONTEXT_TOKEN_LIMIT,
  estimateTokenCount,
  trimMessagesToTokenBudget,
} from "../internal/token-budget";
import type {
  ContextManager,
  ContextManagerCreateInput,
  ConversationContextMessage,
  OrchestratorContext,
  UserProfileContext,
} from "./contract";

const DEFAULT_CONVERSATION_MESSAGE_LIMIT = 10;

function resolveConversationId(
  userId: string,
  metadata?: Readonly<Record<string, unknown>>,
): string {
  const fromMetadata = metadata?.conversationId;
  if (typeof fromMetadata === "string" && fromMetadata.trim().length > 0) {
    return fromMetadata.trim();
  }
  return `conv-${userId}`;
}

function readConversationTurn(
  content: Readonly<Record<string, unknown>>,
): ConversationMemory | undefined {
  const role = content.role;
  const message = content.message;
  if (
    (role !== "user" && role !== "assistant" && role !== "system") ||
    typeof message !== "string"
  ) {
    return undefined;
  }
  return {
    conversationId:
      typeof content.conversationId === "string" ? content.conversationId : "",
    userId: typeof content.userId === "string" ? content.userId : "",
    turnIndex: typeof content.turnIndex === "number" ? content.turnIndex : 0,
    role,
    message,
    taskId: typeof content.taskId === "string" ? content.taskId : undefined,
    intentKind:
      typeof content.intentKind === "string" ? content.intentKind : undefined,
    timestamp:
      typeof content.timestamp === "string"
        ? content.timestamp
        : new Date().toISOString(),
  };
}

function loadRecentMessagesFromMemoryStore(
  store: MemoryStore,
  userId: string,
  conversationId: string,
  limit: number,
): readonly ConversationContextMessage[] {
  const records = store.queryHistory({
    userId,
    conversationId,
    types: ["conversation"],
    limit,
  });

  return records
    .map((record) => readConversationTurn(record.content))
    .filter((turn): turn is ConversationMemory => turn !== undefined)
    .map((turn) => ({
      role: turn.role,
      message: turn.message,
      timestamp: turn.timestamp,
    }));
}

function shouldUseJarvisSqliteMemory(
  env: Readonly<Record<string, string | undefined>>,
): boolean {
  if (process.versions.electron) {
    return false;
  }
  const backend = env.JARVIS_MEMORY_BACKEND?.trim().toLowerCase();
  if (backend === "local" || backend === "") {
    return false;
  }
  if (env.MEMORY_USE_IN_MEMORY_STORAGE === "true") {
    return false;
  }
  const path = env.JARVIS_MEMORY_PATH?.trim();
  if (path && path.length > 0 && backend !== "local") {
    return true;
  }
  return backend === "memory-service";
}

async function resolveUserProfile(
  env: Readonly<Record<string, string | undefined>>,
  userId: string,
  memoryClient?: JarvisMemoryClient,
): Promise<UserProfileContext> {
  if (memoryClient && shouldUseJarvisSqliteMemory(env)) {
    const name =
      (await memoryClient.getUserFact(userId, "name")) ??
      env.JARVIS_USER_DISPLAY_NAME?.trim() ??
      "Haseeb Rasheed";
    return { name };
  }

  const name =
    env.JARVIS_USER_DISPLAY_NAME?.trim() ||
    env.JARVIS_USER_NAME?.trim() ||
    "Haseeb Rasheed";
  return { name };
}

async function loadRecentMessages(options: {
  readonly history: ConversationHistoryRuntime;
  readonly userId: string;
  readonly conversationId: string;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly memoryClient?: JarvisMemoryClient;
  readonly memoryStore?: MemoryStore;
}): Promise<readonly ConversationContextMessage[]> {
  if (options.memoryStore) {
    const fromStore = loadRecentMessagesFromMemoryStore(
      options.memoryStore,
      options.userId,
      options.conversationId,
      DEFAULT_CONVERSATION_MESSAGE_LIMIT,
    );
    if (fromStore.length > 0) {
      return fromStore;
    }
  }

  if (options.memoryClient && shouldUseJarvisSqliteMemory(options.env)) {
    const rows = await options.memoryClient.getRecentConversations(
      options.userId,
      DEFAULT_CONVERSATION_MESSAGE_LIMIT,
    );
    return rows.map((row) => ({
      role: row.role,
      message: row.content,
      timestamp: row.timestamp,
    }));
  }

  const conversation = options.history.getConversation(
    options.conversationId,
    options.userId,
  );
  if (!conversation) {
    return [];
  }

  const recent = conversation.turns.slice(-DEFAULT_CONVERSATION_MESSAGE_LIMIT);
  return recent.map((turn) => ({
    role: turn.role,
    message: turn.message,
    timestamp: turn.timestamp,
  }));
}

/**
 * Builds orchestrator context from local conversation history and user profile.
 */
export class DefaultContextManager implements ContextManager {
  readonly componentId = "context-manager" as const;

  private readonly store = new Map<string, OrchestratorContext>();

  constructor(
    private readonly options: {
      readonly localMemory?: LocalMemoryRuntime;
      readonly conversationHistory?: ConversationHistoryRuntime;
      readonly memoryClient?: JarvisMemoryClient;
      readonly memoryStore?: MemoryStore;
      readonly env?: Readonly<Record<string, string | undefined>>;
    } = {},
  ) {}

  private resolveMemoryClient(
    env: Readonly<Record<string, string | undefined>>,
  ): JarvisMemoryClient | undefined {
    if (this.options.memoryClient) {
      return this.options.memoryClient;
    }
    if (!shouldUseJarvisSqliteMemory(env)) {
      return undefined;
    }
    return getSharedJarvisMemoryClient({ env });
  }

  private history(): ConversationHistoryRuntime {
    const localMemory =
      this.options.localMemory ??
      createDefaultLocalMemoryRuntime({
        useFileBackend: process.env.NODE_ENV !== "test",
      });
    return (
      this.options.conversationHistory ??
      createDefaultConversationHistoryRuntime({ localMemoryRuntime: localMemory })
    );
  }

  async create(input: ContextManagerCreateInput): Promise<OrchestratorContext> {
    const env = this.options.env ?? process.env;
    const conversationId = resolveConversationId(
      input.task.userId,
      input.task.metadata,
    );
    const history = this.history();
    const memoryClient = this.resolveMemoryClient(env);
    const rawMessages = await loadRecentMessages({
      history,
      userId: input.task.userId,
      conversationId,
      env,
      memoryClient,
      memoryStore: this.options.memoryStore,
    });
    const messages = trimMessagesToTokenBudget(
      rawMessages,
      ORCHESTRATOR_CONTEXT_TOKEN_LIMIT,
    );

    const profile = await resolveUserProfile(env, input.task.userId, memoryClient);
    const tokenParts = [
      ...messages.map((entry) => entry.message),
      profile.name,
      input.task.intent.description,
    ];
    const estimatedTokens = tokenParts.reduce(
      (sum, part) => sum + estimateTokenCount(part),
      0,
    );

    const context: OrchestratorContext = {
      contextRef: `ctx-${input.task.id}`,
      taskId: input.task.id,
      userId: input.task.userId,
      createdAt: new Date().toISOString(),
      conversationId,
      messages,
      userProfile: profile,
      estimatedTokens,
      withinTokenLimit: estimatedTokens <= ORCHESTRATOR_CONTEXT_TOKEN_LIMIT,
    };

    this.store.set(context.contextRef, context);
    return context;
  }

  async get(contextRef: string): Promise<OrchestratorContext | undefined> {
    return this.store.get(contextRef);
  }
}
