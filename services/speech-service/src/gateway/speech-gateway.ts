import type {
  SpeechActionResponse,
  SpeechRuntimeHealth,
  SpeechRoutingDecision,
} from "../index";
import type { SpeechGatewayRequest } from "./speech-gateway-request";
import type { SpeechGatewayResponse } from "./speech-gateway-response";

/**
 * Single-entry gateway contract for speech-service provider processing (Phase 36).
 */
export interface SpeechGateway {
  processTranscript(request: SpeechGatewayRequest): Promise<SpeechGatewayResponse>;
  processAction(request: SpeechGatewayRequest): Promise<SpeechActionResponse>;
  resolveProvider(request: SpeechGatewayRequest): Promise<SpeechRoutingDecision>;
  getRuntimeHealth(providerId: string): Promise<SpeechRuntimeHealth>;
}
