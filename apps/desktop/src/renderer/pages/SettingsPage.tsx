import { useEffect, useRef, useState } from "react";

import { getApiUrl } from "../api/jarvis-client";
import { ProviderSettingsPage } from "../providers";
import {
  DEFAULT_VOICE_SETTINGS,
  loadVoiceSettings,
  saveVoiceSettings,
  useSpeechConnection,
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
  const speech = useSpeechConnection();

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
          <dd>Embedded local runtime (no external auth token required)</dd>
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
          STT and TTS run in the Electron main process. Groq Whisper transcribes
          microphone audio; Edge TTS speaks responses.
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
        </ul>

        <p className="settings-voice-meta">
          STT engine:{" "}
          <span className={speech.ready ? "settings-ok" : "settings-muted"}>
            {speech.loading ? "Checking…" : speech.sttEngine}
          </span>
          <br />
          TTS engine:{" "}
          <span className="settings-ok">{speech.loading ? "Checking…" : speech.ttsEngine}</span>
          <br />
          TTS voice: <span className="settings-muted">{speech.ttsVoice}</span>
          <br />
          Microphone:{" "}
          <span className={speech.microphoneGranted ? "settings-ok" : "settings-muted"}>
            {speech.microphoneLabel}
          </span>
        </p>
        {speech.error ? (
          <p className="settings-voice-error" role="alert">
            {speech.error}
          </p>
        ) : null}

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
