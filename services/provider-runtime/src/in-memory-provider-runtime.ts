import type { ProviderConnection } from "./provider-connection";
import type { ProviderHealth } from "./provider-health";
import type { ProviderRegistry } from "./provider-registry";
import type { ProviderRuntime } from "./provider-runtime";
import type { ProviderSession } from "./provider-session";

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `provider-session-${sessionCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildHealth(
  entry: NonNullable<ReturnType<ProviderRegistry["resolve"]>>,
  connection: ProviderConnection | undefined,
  checkedAt: string,
): ProviderHealth {
  const connected = connection?.state === "connected";

  let status: ProviderHealth["status"] = "unavailable";
  if (connected) {
    status = entry.stub ? "healthy" : "degraded";
  }

  return {
    providerId: entry.providerId,
    family: entry.family,
    status,
    connected,
    stub: entry.stub,
    message: connected
      ? entry.stub
        ? "Stub provider connected"
        : "Provider connected (validation only)"
      : connection?.lastError ?? "Provider disconnected",
    checkedAt,
  };
}

/**
 * Deterministic in-memory provider runtime — stub connections only (Phase 60).
 */
export class InMemoryProviderRuntime implements ProviderRuntime {
  private readonly connections = new Map<string, ProviderConnection>();
  private readonly sessions = new Map<string, ProviderSession>();

  constructor(private readonly registry: ProviderRegistry) {}

  async connect(providerId: string): Promise<ProviderSession> {
    const entry = this.requireEntry(providerId);
    const existing = this.connections.get(providerId);

    if (existing?.state === "connected") {
      const session = this.sessions.get(providerId);
      if (session) {
        return session;
      }
    }

    const connecting: ProviderConnection = {
      providerId,
      family: entry.family,
      state: "connecting",
      stub: entry.stub,
      endpoint: entry.endpoint,
    };
    this.connections.set(providerId, connecting);

    const connected: ProviderConnection = {
      ...connecting,
      state: "connected",
      connectedAt: nowIso(),
      lastError: undefined,
    };
    this.connections.set(providerId, connected);

    const session: ProviderSession = {
      sessionId: nextSessionId(),
      providerId,
      connection: connected,
    };
    this.sessions.set(providerId, session);
    return session;
  }

  async disconnect(providerId: string): Promise<ProviderConnection> {
    const entry = this.requireEntry(providerId);
    const current = this.connections.get(providerId);

    const disconnected: ProviderConnection = {
      providerId,
      family: entry.family,
      state: "disconnected",
      stub: entry.stub,
      endpoint: entry.endpoint,
      connectedAt: current?.connectedAt,
      disconnectedAt: nowIso(),
    };

    this.connections.set(providerId, disconnected);
    this.sessions.delete(providerId);
    return disconnected;
  }

  async validateConnection(providerId: string): Promise<boolean> {
    const connection = this.connections.get(providerId);
    if (connection?.state === "connected") {
      return true;
    }

    const session = await this.connect(providerId);
    return session.connection.state === "connected";
  }

  async getHealth(): Promise<readonly ProviderHealth[]> {
    const checkedAt = nowIso();
    return this.registry.list().map((entry) =>
      buildHealth(entry, this.connections.get(entry.providerId), checkedAt),
    );
  }

  async getHealthFor(providerId: string): Promise<ProviderHealth | undefined> {
    const entry = this.registry.resolve(providerId);
    if (!entry) {
      return undefined;
    }

    return buildHealth(entry, this.connections.get(providerId), nowIso());
  }

  private requireEntry(providerId: string) {
    const entry = this.registry.resolve(providerId);
    if (!entry) {
      throw new Error(`Provider not registered: ${providerId}`);
    }
    return entry;
  }
}
