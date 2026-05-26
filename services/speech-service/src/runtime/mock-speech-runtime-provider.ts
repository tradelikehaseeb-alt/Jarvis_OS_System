import type { SpeechRuntimeHealth, SpeechRuntimeProviderId } from "./speech-runtime-health";
import type { SpeechRuntimeProvider } from "./speech-runtime-provider";

const DEFAULT_STATUS_BY_PROVIDER: Readonly<Record<SpeechRuntimeProviderId, SpeechRuntimeHealth["status"]>> =
  {
    "stt-local": "available",
    "tts-local": "available",
    "stt-cloud": "degraded",
    "tts-cloud": "degraded",
  };

/**
 * Deterministic runtime provider for Phase 29.
 *
 * No network calls, no device permissions, no external APIs.
 */
export class MockSpeechRuntimeProvider implements SpeechRuntimeProvider {
  readonly providerId: SpeechRuntimeProviderId;
  private readonly status: SpeechRuntimeHealth["status"];

  constructor(providerId: SpeechRuntimeProviderId) {
    this.providerId = providerId;
    this.status = DEFAULT_STATUS_BY_PROVIDER[providerId];
  }

  async checkHealth(): Promise<SpeechRuntimeHealth> {
    return {
      providerId: this.providerId,
      status: this.status,
      stub: true,
      checkedAt: new Date(0).toISOString(),
      details: `mock runtime ${this.status}`,
    };
  }
}
