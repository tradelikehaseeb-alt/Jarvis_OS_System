import type { SpeechRuntimeProviderId } from "../runtime";
import type { SpeechFallbackProvider } from "./speech-fallback-provider";
import type {
  SpeechFailureContext,
  SpeechRecoveryManager,
  SpeechRecoveryResult,
} from "./speech-recovery-manager";
import type { SpeechRecoveryAction } from "./speech-recovery-action";
import type { SpeechRecoveryEvent } from "./speech-recovery-event";
import type { SpeechRecoveryReason } from "./speech-recovery-reason";

const FIXED_TIMESTAMP = new Date(0).toISOString();

const FALLBACK_BY_PROVIDER: Readonly<
  Record<SpeechRuntimeProviderId, SpeechRuntimeProviderId>
> = {
  "stt-cloud": "stt-local",
  "tts-cloud": "tts-local",
  "stt-local": "stt-cloud",
  "tts-local": "tts-cloud",
};

function actionForReason(reason: SpeechRecoveryReason): SpeechRecoveryAction {
  switch (reason) {
    case "provider-unavailable":
    case "routing-failure":
      return "fallback";
    case "timeout":
      return "retry";
    case "invalid-response":
      return "terminate";
    case "interrupted-session":
      return "continue";
  }
}

/**
 * In-memory deterministic speech recovery manager (Phase 39).
 */
export class InMemorySpeechRecoveryManager implements SpeechRecoveryManager {
  private readonly history: SpeechRecoveryEvent[] = [];
  private sequence = 0;

  handleFailure(context: SpeechFailureContext): SpeechRecoveryResult {
    const action = actionForReason(context.reason);
    const fallbackProviderId = this.selectFallback(context.providerId);
    const providerId =
      action === "fallback" && fallbackProviderId
        ? fallbackProviderId
        : context.providerId;

    const message = this.buildMessage(action, context, fallbackProviderId);
    const event = this.recordEvent(
      context.reason,
      action,
      context.providerId,
      fallbackProviderId,
      message,
    );

    return {
      action,
      providerId,
      ...(fallbackProviderId ? { fallbackProviderId } : {}),
      message,
      event,
    };
  }

  selectFallback(providerId: string): string | undefined {
    const cast = providerId as SpeechRuntimeProviderId;
    return FALLBACK_BY_PROVIDER[cast];
  }

  retryOperation(context: SpeechFailureContext): SpeechRecoveryResult {
    const message = `Retrying operation for ${context.providerId}`;
    const event = this.recordEvent(
      context.reason,
      "retry",
      context.providerId,
      undefined,
      message,
    );
    return {
      action: "retry",
      providerId: context.providerId,
      message,
      event,
    };
  }

  getRecoveryHistory(): readonly SpeechRecoveryEvent[] {
    return [...this.history];
  }

  getFallbackProvider(providerId: SpeechRuntimeProviderId): SpeechFallbackProvider {
    const fallbackProviderId = FALLBACK_BY_PROVIDER[providerId];
    return {
      providerId,
      fallbackProviderId,
      stub: true,
    };
  }

  private recordEvent(
    reason: SpeechRecoveryReason,
    action: SpeechRecoveryAction,
    providerId: string,
    fallbackProviderId: string | undefined,
    message: string,
  ): SpeechRecoveryEvent {
    const event: SpeechRecoveryEvent = {
      eventId: `speech-recovery-${++this.sequence}`,
      reason,
      action,
      providerId,
      ...(fallbackProviderId ? { fallbackProviderId } : {}),
      message,
      at: FIXED_TIMESTAMP,
    };
    this.history.push(event);
    return event;
  }

  private buildMessage(
    action: SpeechRecoveryAction,
    context: SpeechFailureContext,
    fallbackProviderId: string | undefined,
  ): string {
    switch (action) {
      case "fallback":
        return `Fallback from ${context.providerId} to ${fallbackProviderId ?? "none"}`;
      case "retry":
        return `Retry scheduled for ${context.providerId}`;
      case "continue":
        return `Continuing after interrupted session on ${context.providerId}`;
      case "terminate":
        return `Terminating due to invalid response on ${context.providerId}`;
    }
  }
}
