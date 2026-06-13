import { useCallback, useMemo, useState } from "react";

import { VoiceShell } from "../components/VoiceShell";
import { playAudioBase64 } from "../utils/binary";
import {
  loadVoiceSettings,
  useAdaptiveVoiceInput,
  useSpeechConnection,
  type VoiceSettings,
} from "../voice";

function WaveformVisualizer({ levels }: { readonly levels: readonly number[] }) {
  const bars = levels.length > 0 ? levels : [0.1, 0.2, 0.15, 0.25, 0.12, 0.18, 0.22, 0.1];
  return (
    <div className="voice-waveform" aria-hidden data-testid="voice-waveform">
      {bars.map((level, index) => (
        <span
          key={`bar-${index}`}
          className="voice-waveform-bar"
          style={{ transform: `scaleY(${Math.max(0.12, Math.min(1, level))})` }}
        />
      ))}
    </div>
  );
}

/**
 * Voice page — microphone status, test TTS, waveform, wake word.
 */
export function VoicePage() {
  const [voiceSettings] = useState<VoiceSettings>(() => loadVoiceSettings());
  const [previewText, setPreviewText] = useState("");
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const speech = useSpeechConnection();

  const voice = useAdaptiveVoiceInput({
    settings: voiceSettings,
    onTranscriptReady: setPreviewText,
  });

  const micLevels = useMemo(() => {
    if (voice.status === "listening") {
      return [0.35, 0.55, 0.42, 0.68, 0.5, 0.62, 0.4, 0.58];
    }
    return [0.08, 0.1, 0.09, 0.11, 0.08, 0.1, 0.09, 0.08];
  }, [voice.status]);

  const testVoice = useCallback(async () => {
    setTestStatus("Speaking…");
    try {
      const response = await window.jarvis.speechSpeak({
        text: "Hello I am Jarvis",
      });
      if (response.error) {
        setTestStatus(response.error.message);
        return;
      }
      if (response.audioBase64) {
        playAudioBase64(response.audioBase64, response.mimeType ?? "audio/mpeg");
      }
      setTestStatus("Connected ✅ — test phrase spoken");
    } catch (error) {
      setTestStatus(error instanceof Error ? error.message : "Test voice failed");
    }
  }, []);

  return (
    <div className="page-card voice-page">
      <h2>Voice</h2>
      <p className="voice-page-lead">
        Groq Whisper STT and Edge TTS run via the desktop main process. Grant
        microphone access to capture commands.
      </p>

      <section className="voice-status-panel" aria-label="Voice engine status">
        <ul className="voice-status-list">
          <li>
            STT: <strong>{speech.sttEngine}</strong>
          </li>
          <li>
            TTS: <strong>{speech.ttsEngine}</strong>
          </li>
          <li>
            Microphone: <strong>{speech.microphoneLabel}</strong>
          </li>
          <li>
            Wake word: <strong>hey jarvis</strong> (enabled)
          </li>
        </ul>
        <WaveformVisualizer levels={micLevels} />
        <button type="button" className="btn btn-primary" onClick={() => void testVoice()}>
          Test Voice
        </button>
        {testStatus ? (
          <p className="voice-test-status" role="status">
            {testStatus}
          </p>
        ) : null}
      </section>

      <VoiceShell voice={voice} settings={voiceSettings} />

      <section className="voice-page-preview" aria-label="Transcript preview">
        <h3>Composer preview</h3>
        <p className="voice-page-preview-hint">
          Transcript appears here after STT completes. Enable push-to-chat in
          Settings to forward text to the command center.
        </p>
        <textarea
          className="voice-page-textarea"
          readOnly
          value={previewText}
          placeholder="Speak to capture a transcript…"
          aria-label="Transcript preview"
        />
      </section>
    </div>
  );
}
