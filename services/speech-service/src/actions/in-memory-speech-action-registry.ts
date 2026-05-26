import type { SpeechAction } from "./speech-action";
import type { SpeechActionHandler } from "./speech-action-handler";
import type {
  RegisteredSpeechAction,
  SpeechActionRegistry,
} from "./speech-action-registry";

/**
 * In-memory deterministic registry for speech actions (Phase 34).
 */
export class InMemorySpeechActionRegistry implements SpeechActionRegistry {
  private readonly byCommand = new Map<string, RegisteredSpeechAction>();

  register(action: SpeechAction, handler: SpeechActionHandler): void {
    this.byCommand.set(action.command.trim().toLowerCase(), {
      action,
      handler,
    });
  }

  resolve(command: string): RegisteredSpeechAction | undefined {
    return this.byCommand.get(command.trim().toLowerCase());
  }

  list(): readonly RegisteredSpeechAction[] {
    return [...this.byCommand.values()].sort((a, b) =>
      a.action.command.localeCompare(b.action.command),
    );
  }
}
