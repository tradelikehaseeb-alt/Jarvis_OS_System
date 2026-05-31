import { useEffect, useRef, useState } from "react";

import { getApiUrl } from "../api/jarvis-client";
import { ProviderSettingsPage } from "../providers";
import {
  DEFAULT_VOICE_SETTINGS,
  loadVoiceSettings,
  saveVoiceSettings,
  type VoiceSettings,
} from "../voice";

/** Settings page — API URL + voice shell preferences (Phase 18, 25). */
export function SettingsPage() {
  const [apiUrl, setApiUrl] = useState<string>("…");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() =>
    loadVoiceSettings(),
  );
  const [voiceSaved, setVoiceSaved] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setApiUrl(await getApiUrl());
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
  }, []);

  const updateVoice = (patch: Partial<VoiceSettings>) => {
    const next = { ...voiceSettings, ...patch };
    setVoiceSettings(next);
    saveVoiceSettings(next);
    setVoiceSaved(true);
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      setVoiceSaved(false);
      saveTimerRef.current = null;
    }, 2_000);
  };

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    },
    [],
  );

  return (
    <div className="page-card settings-page">
      <h2>Settings</h2>

      <section aria-labelledby="settings-api-heading">
        <h3 id="settings-api-heading">Gateway</h3>
        <dl>
          <dt>API gateway</dt>
          <dd>{loadError ?? apiUrl}</dd>
          <dt>Authentication</dt>
          <dd style={{ color: "var(--muted)" }}>Not configured (Phase 18)</dd>
          <dt>Theme</dt>
          <dd>Dark (default)</dd>
        </dl>
      </section>

      <section
        className="settings-voice-section"
        aria-labelledby="settings-voice-heading"
      >
        <h3 id="settings-voice-heading">Voice</h3>
        <p className="settings-voice-note">
          Voice-native command center uses streaming STT/TTS when a real microphone
          is enabled. Tasks route through the Jarvis API to Hermes and OpenClaw.
        </p>

        <ul className="settings-voice-list">
          <li>
            <label>
              <input
                type="checkbox"
                checked={voiceSettings.showTranscriptPanel}
                onChange={(e) =>
                  updateVoice({ showTranscriptPanel: e.target.checked })
                }
              />
              Show transcript panel in Chat
            </label>
          </li>
          <li>
            <label>
              <input
                type="checkbox"
                checked={voiceSettings.pushToChatInput}
                onChange={(e) =>
                  updateVoice({ pushToChatInput: e.target.checked })
                }
              />
              Push transcript to chat input
            </label>
          </li>
          <li>
            <label>
              <input
                type="checkbox"
                checked={voiceSettings.enableNormalization}
                aria-label="Enable speech normalization before intent classification"
                onChange={(e) =>
                  updateVoice({ enableNormalization: e.target.checked })
                }
              />
              Enable speech normalization before intent classification
            </label>
          </li>
          <li>
            <label>
              <input
                type="checkbox"
                checked={voiceSettings.simulateCaptureError}
                onChange={(e) =>
                  updateVoice({ simulateCaptureError: e.target.checked })
                }
              />
              Simulate capture error (test UI)
            </label>
          </li>
        </ul>

        <p className="settings-voice-meta">
          STT engine: <span className="settings-muted">Not connected</span>
          <br />
          TTS engine: <span className="settings-muted">Not connected</span>
          <br />
          Microphone: <span className="settings-muted">Not accessed</span>
        </p>

        {voiceSaved ? (
          <p className="settings-saved" role="status">
            Voice settings saved
          </p>
        ) : null}

        <button
          type="button"
          className="btn btn-secondary settings-reset-voice"
          onClick={() => updateVoice(DEFAULT_VOICE_SETTINGS)}
        >
          Reset voice defaults
        </button>
      </section>

      <ProviderSettingsPage />
    </div>
  );
}
