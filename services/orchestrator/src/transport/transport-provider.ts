import type { TransportHealth } from "./transport-health";
import type {
  PublishTransportMessageInput,
  TransportMessage,
} from "./transport-message";
import type {
  OpenTransportSessionInput,
  TransportSession,
} from "./transport-session";

export type TransportSubscriberHandler = (message: TransportMessage) => void;

/**
 * Pluggable event transport backend contract (Phase 52).
 */
export interface TransportProvider {
  readonly providerId: string;
  publish(input: PublishTransportMessageInput): TransportMessage;
  subscribe(
    subscriberId: string,
    handler: TransportSubscriberHandler,
  ): () => void;
  unsubscribe(subscriberId: string): void;
  getHealth(): TransportHealth;
  getActiveSessions(): readonly TransportSession[];
  openSession(input: OpenTransportSessionInput): TransportSession;
  closeSession(streamSessionId: string): TransportSession | undefined;
  getRecentMessages(limit?: number): readonly TransportMessage[];
}
