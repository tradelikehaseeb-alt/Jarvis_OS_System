import type { SpeechRuntimeHealth, SpeechRuntimeProviderId } from "./speech-runtime-health";
import type { SpeechRuntimeProvider } from "./speech-runtime-provider";

/**
 * Runtime manager contract for speech providers (Phase 29).
 */
export interface SpeechRuntimeManager {
  register(provider: SpeechRuntimeProvider): void;
  get(providerId: SpeechRuntimeProviderId): SpeechRuntimeProvider | undefined;
  listProviderIds(): readonly SpeechRuntimeProviderId[];
  checkHealth(providerId: SpeechRuntimeProviderId): Promise<SpeechRuntimeHealth>;
}
