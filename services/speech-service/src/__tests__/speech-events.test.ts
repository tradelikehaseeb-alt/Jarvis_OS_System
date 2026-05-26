import { describe, expect, it, vi } from "vitest";

import {
  InMemorySpeechEventBus,
  InMemorySpeechStreamManager,
  createDefaultSpeechEventBus,
} from "../events";

describe("speech events", () => {
  it("supports subscribe, emit, and unsubscribe", () => {
    const bus = new InMemorySpeechEventBus();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe(listener);

    bus.emit({
      eventId: "event-1",
      type: "session-created",
      sessionId: "session-1",
      at: new Date(0).toISOString(),
      payload: { state: "idle" },
    });

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    bus.emit({
      eventId: "event-2",
      type: "listening-started",
      sessionId: "session-1",
      at: new Date(0).toISOString(),
      payload: { state: "listening" },
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("creates default event bus", () => {
    const bus = createDefaultSpeechEventBus();
    const listener = vi.fn();
    bus.subscribe(listener);
    bus.emit({
      eventId: "event-3",
      type: "processing-started",
      sessionId: "session-2",
      at: new Date(0).toISOString(),
      payload: { state: "processing" },
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("supports deterministic stream lifecycle", () => {
    const manager = new InMemorySpeechStreamManager();
    const created = manager.createStream("stream-1");
    expect(created).toMatchObject({
      streamId: "stream-1",
      closed: false,
      chunks: [],
    });

    const withChunk = manager.appendChunk("stream-1", "hello");
    expect(withChunk.chunks.length).toBe(1);
    expect(withChunk.chunks[0]).toMatchObject({
      chunkId: "speech-chunk-1",
      text: "hello",
      index: 0,
    });

    const closed = manager.closeStream("stream-1");
    expect(closed.closed).toBe(true);
    expect(closed.closedAt).toBe(new Date(0).toISOString());
  });

  it("throws descriptive errors for invalid stream operations", () => {
    const manager = new InMemorySpeechStreamManager();
    expect(() => manager.appendChunk("missing", "x")).toThrow(
      "Speech stream not found: missing",
    );

    manager.createStream("stream-2");
    manager.closeStream("stream-2");
    expect(() => manager.appendChunk("stream-2", "x")).toThrow(
      "Speech stream is closed: stream-2",
    );
  });
});
