import type { TransportHealth } from "./transport-health";
import type {
  PublishTransportMessageInput,
  TransportMessage,
} from "./transport-message";
import type {
  OpenTransportSessionInput,
  TransportSession,
} from "./transport-session";
import type {
  TransportProviderRegistry,
} from "./transport-provider-registry";
import type { TransportSubscriberHandler } from "./transport-provider";

/**
 * Orchestrator transport runtime facade (Phase 52).
 */
export class TransportRuntime {
  constructor(private readonly registry: TransportProviderRegistry) {}

  publish(
    input: PublishTransportMessageInput,
    providerId?: string,
  ): TransportMessage {
    return this.registry.resolve(providerId).publish(input);
  }

  subscribe(
    subscriberId: string,
    handler: TransportSubscriberHandler,
    providerId?: string,
  ): () => void {
    return this.registry.resolve(providerId).subscribe(subscriberId, handler);
  }

  unsubscribe(subscriberId: string, providerId?: string): void {
    this.registry.resolve(providerId).unsubscribe(subscriberId);
  }

  getHealth(providerId?: string): TransportHealth {
    return this.registry.getHealth(providerId);
  }

  getActiveSessions(providerId?: string): readonly TransportSession[] {
    return this.registry.resolve(providerId).getActiveSessions();
  }

  openSession(
    input: OpenTransportSessionInput,
    providerId?: string,
  ): TransportSession {
    return this.registry.resolve(providerId).openSession(input);
  }

  closeSession(
    streamSessionId: string,
    providerId?: string,
  ): TransportSession | undefined {
    return this.registry.resolve(providerId).closeSession(streamSessionId);
  }

  getRecentMessages(
    limit?: number,
    providerId?: string,
  ): readonly TransportMessage[] {
    return this.registry.resolve(providerId).getRecentMessages(limit);
  }

  getDefaultProviderId(): string {
    return this.registry.getDefaultProviderId();
  }

  listProviderIds(): readonly string[] {
    return this.registry.listProviderIds();
  }
}
