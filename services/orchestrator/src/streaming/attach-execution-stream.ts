import type { ExecutionActivity } from "../execution/execution-activity";
import type { ExecutionEvent } from "../execution/execution-event";
import type { ExecutionLifecycleManager } from "../execution/execution-lifecycle-manager";
import type { AttachLifecycleContext } from "../memory/memory-persistence-manager";
import type { StreamManager } from "./stream-manager";
import type { StreamEventType } from "./stream-event-type";

export interface AttachExecutionStreamContext extends AttachLifecycleContext {
  readonly streamSessionId: string;
}

function publish(
  streamManager: StreamManager,
  context: AttachExecutionStreamContext,
  type: StreamEventType,
  message: string,
  payload?: Readonly<Record<string, unknown>>,
): void {
  streamManager.publish({
    type,
    streamSessionId: context.streamSessionId,
    sessionId: context.sessionId,
    taskId: context.taskId,
    userId: context.userId,
    conversationId: context.conversationId,
    message,
    payload,
  });
}

function mapActivityKind(
  kind: ExecutionActivity["kind"],
): StreamEventType | undefined {
  switch (kind) {
    case "planning_started":
      return "planning_started";
    case "planning_completed":
      return "planning_completed";
    case "execution_started":
      return "execution_started";
    case "execution_completed":
      return "execution_completed";
    default:
      return undefined;
  }
}

function mapLifecycleEvent(
  event: ExecutionEvent,
): StreamEventType | undefined {
  if (event.kind === "session_failed") {
    return "failed";
  }
  if (event.kind === "session_completed") {
    return "execution_completed";
  }
  if (event.kind === "state_changed") {
    switch (event.state) {
      case "planning":
        return "planning_started";
      case "executing":
        return "execution_started";
      case "failed":
        return "failed";
      case "completed":
        return "execution_completed";
      default:
        return undefined;
    }
  }
  return undefined;
}

/**
 * Bridge execution lifecycle events to the real-time stream (Phase 47).
 */
export function attachExecutionStream(
  streamManager: StreamManager,
  lifecycle: ExecutionLifecycleManager,
  context: AttachExecutionStreamContext,
): () => void {
  streamManager.openSession({
    streamSessionId: context.streamSessionId,
    taskId: context.taskId,
    userId: context.userId,
    sessionId: context.sessionId,
    conversationId: context.conversationId,
  });

  publish(
    streamManager,
    context,
    "execution_started",
    "Task execution stream opened",
  );

  const unsubscribeEvents = lifecycle.subscribe((event) => {
    const type = mapLifecycleEvent(event);
    if (type) {
      publish(
        streamManager,
        context,
        type,
        event.message ?? `Lifecycle ${event.kind}`,
        { lifecycleEventKind: event.kind, state: event.state },
      );
    }
  });

  const unsubscribeActivities = lifecycle.subscribeActivities((activity) => {
    const type = mapActivityKind(activity.kind);
    if (type) {
      publish(
        streamManager,
        context,
        type,
        activity.summary,
        {
          activityKind: activity.kind,
          source: activity.source,
        },
      );
    }
  });

  return () => {
    unsubscribeEvents();
    unsubscribeActivities();
  };
}

export function publishStreamFailed(
  streamManager: StreamManager,
  context: AttachExecutionStreamContext,
  message: string,
): void {
  publish(streamManager, context, "failed", message);
  streamManager.closeSession(context.streamSessionId);
}

export function completeExecutionStream(
  streamManager: StreamManager,
  context: AttachExecutionStreamContext,
  success: boolean,
): void {
  if (!success) {
    publishStreamFailed(streamManager, context, "Task execution failed");
    return;
  }
  streamManager.closeSession(context.streamSessionId);
}
