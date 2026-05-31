import { createDefaultSpeechActionRouter } from "../actions/speech-action-router";
import type { SpeechActionResponse } from "../actions/speech-action-response";
import { createDefaultSpeechCapabilityRouter } from "../routing/speech-capability-router";
import type { SpeechCapability } from "../routing/speech-capability";
import type { SpeechRoutingDecision } from "../routing/speech-routing-decision";
import { SpeechNormalizer } from "../speech-normalizer";
import {
  InMemorySpeechRuntimeManager,
  MockSpeechRuntimeProvider,
  type SpeechRuntimeHealth,
  type SpeechRuntimeProviderId,
} from "../runtime";
import type { SpeechGateway } from "./speech-gateway";
import type { SpeechGatewayRequest } from "./speech-gateway-request";
import type { SpeechGatewayResponse } from "./speech-gateway-response";

const DEFAULT_PROVIDER_IDS: readonly SpeechRuntimeProviderId[] = [
  "stt-local",
  "stt-cloud",
  "tts-local",
  "tts-cloud",
];

const DEFAULT_CAPABILITIES: readonly SpeechCapability[] = ["low-latency"];

/**
 * Deterministic default speech gateway using in-memory stub layers only (Phase 36).
 */
export class DefaultSpeechGateway implements SpeechGateway {
  private readonly normalizer = new SpeechNormalizer();
  private readonly actionRouter = createDefaultSpeechActionRouter();
  private readonly capabilityRouter = createDefaultSpeechCapabilityRouter();
  private readonly runtimeManager = new InMemorySpeechRuntimeManager();

  constructor() {
    for (const providerId of DEFAULT_PROVIDER_IDS) {
      this.runtimeManager.register(new MockSpeechRuntimeProvider(providerId));
    }
  }

  async processTranscript(
    request: SpeechGatewayRequest,
  ): Promise<SpeechGatewayResponse> {
    const normalized = this.normalizer.normalize(request.transcript, {
      domain: "general",
    });
    const action = await this.processAction({
      ...request,
      transcript: normalized.normalized,
    });
    const routing = await this.resolveProvider(request);
    const runtimeHealth = await this.getRuntimeHealth(routing.providerId);

    return {
      requestId: request.requestId,
      normalizedTranscript: normalized.normalized,
      action,
      routing,
      runtimeHealth,
    };
  }

  async processAction(request: SpeechGatewayRequest): Promise<SpeechActionResponse> {
    return this.actionRouter.route({
      requestId: request.requestId,
      transcript: request.transcript,
      conversationId: request.conversationId,
    });
  }

  async resolveProvider(
    request: SpeechGatewayRequest,
  ): Promise<SpeechRoutingDecision> {
    return this.capabilityRouter.route({
      providerIds: request.providerIds ?? DEFAULT_PROVIDER_IDS,
      requestedCapabilities: request.requestedCapabilities ?? DEFAULT_CAPABILITIES,
    });
  }

  async getRuntimeHealth(providerId: string): Promise<SpeechRuntimeHealth> {
    const cast = providerId as SpeechRuntimeProviderId;
    return this.runtimeManager.checkHealth(cast);
  }
}
