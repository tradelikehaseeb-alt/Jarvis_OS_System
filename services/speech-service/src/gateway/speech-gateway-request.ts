import type { SpeechCapability, SpeechRuntimeProviderId } from "../index";

/**
 * Input model accepted by speech gateway entry points (Phase 36).
 */
export interface SpeechGatewayRequest {
  readonly requestId: string;
  readonly transcript: string;
  readonly conversationId?: string;
  readonly providerIds?: readonly SpeechRuntimeProviderId[];
  readonly requestedCapabilities?: readonly SpeechCapability[];
}
