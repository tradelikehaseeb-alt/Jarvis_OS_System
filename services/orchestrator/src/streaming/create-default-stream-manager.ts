import { TransportBackedStreamManager } from "./transport-backed-stream-manager";
import type { StreamManager } from "./stream-manager";
import {
  createDefaultTransportRuntime,
  createLocalEventTransportRuntime,
} from "../transport/create-default-transport-runtime";

/**
 * Factory for default in-memory stream manager (Phase 47).
 * Uses {@link TransportBackedStreamManager} with in-memory transport runtime (Phase 52).
 */
export function createDefaultStreamManager(): StreamManager {
  return new TransportBackedStreamManager(createDefaultTransportRuntime());
}

/**
 * Stream manager with local event file transport (Phase 52).
 */
export function createLocalEventStreamManager(filePath: string): StreamManager {
  return new TransportBackedStreamManager(
    createLocalEventTransportRuntime(filePath),
  );
}
