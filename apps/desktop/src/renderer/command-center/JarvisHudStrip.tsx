import { useEffect, useState } from "react";

import type { VoiceSessionState } from "@jarvis/speech-service";

import type { useSpeechConnection } from "../voice/use-speech-connection";

export interface JarvisHudStripProps {
  readonly speech: ReturnType<typeof useSpeechConnection>;
  readonly voiceLive: boolean;
  readonly sessionState: VoiceSessionState;
  readonly sttLatencyMs?: number;
  readonly transcriptConfidence?: number;
}

interface CoreHudStatus {
  readonly connected: boolean;
  readonly label: string;
}

/**
 * Compact HUD — only real Jarvis subsystem status (Hermes, voice STT, session).
 */
export function JarvisHudStrip({
  speech,
  voiceLive,
  sessionState,
}: JarvisHudStripProps) {
  const [coreStatus, setCoreStatus] = useState<CoreHudStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = (await window.jarvis.getHermesStartupStatus()) as {
          connected: boolean;
          label: string;
        };
        if (!cancelled) {
          setCoreStatus({ connected: result.connected, label: result.label });
        }
      } catch {
        if (!cancelled) {
          setCoreStatus({ connected: false, label: "Jarvis core: Offline" });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const voiceLabel = speech.loading
    ? "Voice…"
    : voiceLive
      ? "Voice live"
      : "Voice stub";

  const sessionLabel =
    sessionState === "listening"
      ? "Listening"
      : sessionState === "thinking"
        ? "Processing"
        : sessionState === "executing"
          ? "Executing"
          : sessionState === "speaking"
            ? "Speaking"
            : "Standby";

  return (
    <div
      className="jarvis-hud-strip cc-glass cc-hud-strip"
      data-testid="jarvis-hud-strip"
      role="status"
    >
      <div className="jarvis-hud-strip__segment">
        <span
          className={`jarvis-hud-strip__dot${coreStatus?.connected ? " jarvis-hud-strip__dot--ok" : ""}`}
          aria-hidden
        />
        <span className="jarvis-hud-strip__label">
          {coreStatus?.label ?? "Jarvis core…"}
        </span>
      </div>
      <div className="jarvis-hud-strip__segment">
        <span
          className={`jarvis-hud-strip__dot${voiceLive ? " jarvis-hud-strip__dot--ok" : ""}`}
          aria-hidden
        />
        <span className="jarvis-hud-strip__label">{voiceLabel}</span>
      </div>
      <div className="jarvis-hud-strip__segment jarvis-hud-strip__segment--muted">
        <span className="jarvis-hud-strip__label">{sessionLabel}</span>
      </div>
    </div>
  );
}
