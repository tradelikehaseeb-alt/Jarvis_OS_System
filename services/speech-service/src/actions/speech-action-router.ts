import { InMemorySpeechActionRegistry } from "./in-memory-speech-action-registry";
import type { SpeechAction } from "./speech-action";
import type { SpeechActionHandler } from "./speech-action-handler";
import type { SpeechActionRegistry } from "./speech-action-registry";
import type { SpeechActionRequest } from "./speech-action-request";
import type { SpeechActionResponse } from "./speech-action-response";
import type { SpeechActionType } from "./speech-action-type";

/**
 * Deterministic transcript command router for speech actions (Phase 34).
 */
export class SpeechActionRouter {
  constructor(private readonly registry: SpeechActionRegistry) {}

  route(request: SpeechActionRequest): SpeechActionResponse {
    const command = request.transcript.trim().toLowerCase();
    const resolved = this.registry.resolve(command);
    if (!resolved) {
      return {
        requestId: request.requestId,
        handled: false,
        message: `No speech action mapped for command: ${command || "<empty>"}`,
      };
    }
    return resolved.handler(resolved.action, request);
  }
}

function createDefaultAction(
  type: SpeechActionType,
  description: string,
): SpeechAction {
  return {
    actionId: `speech-action-${type}`,
    type,
    command: type,
    description,
  };
}

function createDefaultHandler(message: string): SpeechActionHandler {
  return (action, request) => ({
    requestId: request.requestId,
    handled: true,
    action,
    message,
  });
}

export function createDefaultSpeechActionRouter(): SpeechActionRouter {
  const registry = new InMemorySpeechActionRegistry();

  registry.register(
    createDefaultAction("stop", "Stop current voice flow"),
    createDefaultHandler("Voice flow stopped"),
  );
  registry.register(
    createDefaultAction("continue", "Continue paused voice flow"),
    createDefaultHandler("Voice flow continued"),
  );
  registry.register(
    createDefaultAction("repeat", "Repeat last assistant response"),
    createDefaultHandler("Repeating last response"),
  );
  registry.register(
    createDefaultAction("cancel", "Cancel active voice action"),
    createDefaultHandler("Voice action cancelled"),
  );
  registry.register(
    createDefaultAction("help", "List supported voice commands"),
    createDefaultHandler("Supported commands: stop, continue, repeat, cancel, help, open-settings"),
  );
  registry.register(
    createDefaultAction("open-settings", "Open voice settings"),
    createDefaultHandler("Opening voice settings"),
  );

  return new SpeechActionRouter(registry);
}
