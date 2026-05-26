import { DefaultSpeechGateway } from "./default-speech-gateway";
import type { SpeechGateway } from "./speech-gateway";

/**
 * Factory contract for constructing speech gateway instances (Phase 36).
 */
export interface SpeechGatewayFactory {
  create(): SpeechGateway;
}

class DefaultSpeechGatewayFactory implements SpeechGatewayFactory {
  create(): SpeechGateway {
    return new DefaultSpeechGateway();
  }
}

export function createDefaultSpeechGateway(): SpeechGateway {
  return new DefaultSpeechGatewayFactory().create();
}
