import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  clearCrashRecoveryPending,
  markCrashRecoveryPending,
} from "../session-checkpoint-storage";
import { desktopCrashRecovery } from "../desktop-crash-recovery";
import { sessionRestoreRuntime } from "../session-restore-runtime";
import { ReconnectIndicator } from "../ReconnectIndicator";

describe("DesktopCrashRecovery", () => {
  it("detects pending crash recovery flag", () => {
    markCrashRecoveryPending();
    const state = desktopCrashRecovery.inspect();
    expect(state.pending).toBe(true);
    clearCrashRecoveryPending();
  });
});

describe("SessionRestoreRuntime", () => {
  it("restores saved checkpoint messages", () => {
    sessionRestoreRuntime.persistCheckpoint(
      "ws-94",
      "conv-94",
      [{ id: "1", role: "user", text: "Continue planning" }],
      "task-94",
    );
    const restored = sessionRestoreRuntime.restore("ws-94");
    expect(restored.restored).toBe(true);
    expect(restored.messages[0]?.text).toContain("Continue planning");
  });
});

describe("ReconnectIndicator", () => {
  it("shows reconnect message", () => {
    render(<ReconnectIndicator visible message="Reconnecting…" degraded />);
    expect(screen.getByTestId("reconnect-indicator")).toHaveTextContent("Reconnecting");
  });
});
