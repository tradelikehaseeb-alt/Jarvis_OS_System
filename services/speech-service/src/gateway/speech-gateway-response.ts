import type {
  SpeechActionResponse,
  SpeechRuntimeHealth,
  SpeechRoutingDecision,
} from "../index";

/**
 * Gateway-level deterministic response envelope (Phase 36).
 */
export interface SpeechGatewayResponse {
  readonly requestId: string;
  readonly normalizedTranscript: string;
  readonly action: SpeechActionResponse;
  readonly routing: SpeechRoutingDecision;
  readonly runtimeHealth: SpeechRuntimeHealth;
}
