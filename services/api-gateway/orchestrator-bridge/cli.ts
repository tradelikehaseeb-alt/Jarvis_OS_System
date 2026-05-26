/**
 * Local CLI bridge — TEMPORARY development transport (Phase 7–14).
 *
 * Invoked by LocalCliTransport (Python subprocess). Calls createDefaultOrchestratorService().
 *
 * Replace with a standalone orchestrator service reached via HTTP/gRPC/message queue;
 * this file should not run in production.
 *
 * Usage: npx tsx cli.ts <method> < stdin JSON
 * Methods: createTask | getTaskStatus | sendConversation
 */
import {
  createDefaultOrchestratorService,
  createOrchestratorService,
} from "@jarvis/orchestrator";
import type { TaskIntentPriority } from "@jarvis/types";
import { readFileSync } from "node:fs";

type CreateTaskInput = {
  intent: {
    kind: string;
    description: string;
    parameters?: Record<string, unknown>;
    priority?: TaskIntentPriority;
  };
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

async function readStdinJson<T>(): Promise<T> {
  const raw = readFileSync(0, "utf-8");
  return JSON.parse(raw) as T;
}

async function main(): Promise<void> {
  const method = process.argv[2];

  switch (method) {
    case "createTask": {
      const body = await readStdinJson<CreateTaskInput>();
      const service = await createDefaultOrchestratorService();
      const { record } = await service.executeCreateTask({
        intent: {
          kind: body.intent.kind,
          description: body.intent.description,
          parameters: body.intent.parameters,
          priority: body.intent.priority,
        },
        correlationId: body.correlationId,
        metadata: body.metadata,
      });

      process.stdout.write(
        JSON.stringify({
          taskId: record.createTaskResponse.taskId,
          status: record.createTaskResponse.status,
          createdAt: record.createTaskResponse.createdAt,
          correlationId: record.createTaskResponse.correlationId ?? null,
        }),
      );
      return;
    }

    case "getTaskStatus": {
      const { taskId } = await readStdinJson<{ taskId: string }>();
      const service = await createDefaultOrchestratorService();
      const status = await service.getTaskStatus(taskId);

      if (!status) {
        process.stderr.write(
          JSON.stringify({
            code: "TASK_NOT_FOUND",
            message: `Task ${taskId} not found`,
          }),
        );
        process.exitCode = 1;
        return;
      }

      process.stdout.write(JSON.stringify(status));
      return;
    }

    case "sendConversation": {
      const body = await readStdinJson<{
        message: string;
        sessionId?: string;
      }>();
      const service = createOrchestratorService();
      await service.components.agentRegistry.list();

      process.stdout.write(
        JSON.stringify({
          sessionId: body.sessionId ?? `sess-stub-${Date.now()}`,
          reply: `Jarvis stub: received your message (${body.message.length} chars).`,
          taskId: null,
          createdAt: new Date().toISOString(),
        }),
      );
      return;
    }

    default: {
      process.stderr.write(JSON.stringify({ code: "UNKNOWN_METHOD", message: method }));
      process.exitCode = 1;
    }
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(JSON.stringify({ code: "BRIDGE_ERROR", message }));
  process.exitCode = 1;
});
