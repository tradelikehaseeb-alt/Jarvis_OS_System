import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { InMemoryTransportProvider } from "./in-memory-transport-provider";
import type { TransportHealth } from "./transport-health";
import type {
  PublishTransportMessageInput,
  TransportMessage,
} from "./transport-message";
import type {
  OpenTransportSessionInput,
  TransportSession,
} from "./transport-session";
import type { TransportProvider, TransportSubscriberHandler } from "./transport-provider";

/** Default JSON file for local event transport (Phase 52). */
export const DEFAULT_LOCAL_TRANSPORT_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "api-gateway",
  ".jarvis-task-store",
  "stream-events.json",
);

type StoreFileShape = {
  readonly messages: readonly TransportMessage[];
};

/**
 * Local process transport — in-memory dispatch with JSON file persistence.
 *
 * Enables cross-subprocess event replay without WebSockets (Phase 52).
 */
export class LocalEventTransportProvider implements TransportProvider {
  readonly providerId = "local-event" as const;

  private readonly backing = new InMemoryTransportProvider();

  constructor(private readonly filePath: string = DEFAULT_LOCAL_TRANSPORT_FILE) {
    this.loadFromDisk();
  }

  openSession(input: OpenTransportSessionInput): TransportSession {
    return this.backing.openSession(input);
  }

  closeSession(streamSessionId: string): TransportSession | undefined {
    const closed = this.backing.closeSession(streamSessionId);
    if (closed) {
      this.flushToDisk();
    }
    return closed;
  }

  publish(input: PublishTransportMessageInput): TransportMessage {
    const message = this.backing.publish(input);
    this.flushToDisk();
    return message;
  }

  subscribe(
    subscriberId: string,
    handler: TransportSubscriberHandler,
  ): () => void {
    return this.backing.subscribe(subscriberId, handler);
  }

  unsubscribe(subscriberId: string): void {
    this.backing.unsubscribe(subscriberId);
  }

  getHealth(): TransportHealth {
    const health = this.backing.getHealth();
    return {
      ...health,
      providerId: this.providerId,
      message: existsSync(this.filePath)
        ? `Local event store at ${this.filePath}`
        : "Local event store not yet created",
    };
  }

  getActiveSessions(): readonly TransportSession[] {
    return this.backing.getActiveSessions();
  }

  getRecentMessages(limit?: number): readonly TransportMessage[] {
    return this.backing.getRecentMessages(limit);
  }

  getFilePath(): string {
    return this.filePath;
  }

  private loadFromDisk(): void {
    if (!existsSync(this.filePath)) {
      return;
    }

    try {
      const raw = readFileSync(this.filePath, "utf-8");
      const data = JSON.parse(raw) as StoreFileShape;
      if (data.messages?.length) {
        this.backing.restoreMessages(data.messages);
      }
    } catch {
      /* ignore corrupt store in dev */
    }
  }

  private flushToDisk(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const data: StoreFileShape = {
      messages: this.backing.getRecentMessages(),
    };

    writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}
