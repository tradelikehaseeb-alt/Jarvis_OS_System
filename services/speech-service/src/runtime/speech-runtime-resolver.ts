import type { SpeechRuntimeHealth, SpeechRuntimeProviderId } from "./speech-runtime-health";
import type { SpeechRuntimeManager } from "./speech-runtime-manager";

/**
 * Resolver contract for selecting/checking provider runtime state (Phase 29).
 */
export interface SpeechRuntimeResolver {
  resolve(providerId: SpeechRuntimeProviderId): Promise<SpeechRuntimeHealth>;
}

class DefaultSpeechRuntimeResolver implements SpeechRuntimeResolver {
  constructor(private readonly manager: SpeechRuntimeManager) {}

  async resolve(providerId: SpeechRuntimeProviderId): Promise<SpeechRuntimeHealth> {
    return this.manager.checkHealth(providerId);
  }
}

export function createDefaultSpeechRuntimeResolver(
  manager: SpeechRuntimeManager,
): SpeechRuntimeResolver {
  return new DefaultSpeechRuntimeResolver(manager);
}
