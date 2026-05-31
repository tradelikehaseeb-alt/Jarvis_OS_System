import { useState } from "react";

import { VoiceShell } from "../components/VoiceShell";
import { loadVoiceSettings, useAdaptiveVoiceInput, type VoiceSettings } from "../voice";

/**
 * Voice page — adaptive mock (test) or real microphone + STT (production).
 */
export function VoicePage() {
  const [voiceSettings] = useState<VoiceSettings>(() => loadVoiceSettings());
  const [previewText, setPreviewText] = useState("");

  const voice = useAdaptiveVoiceInput({
    settings: voiceSettings,
    onTranscriptReady: setPreviewText,
  });

  return (
    <div className="page-card voice-page">
      <h2>Voice</h2>
      <p className="voice-page-lead">
        Voice uses speech-service STT/TTS in production; tests keep the mock
        pipeline. Use Chat to run intent classification and task submission.
      </p>

      <VoiceShell voice={voice} settings={voiceSettings} />

      <section className="voice-page-preview" aria-label="Transcript preview">
        <h3>Composer preview</h3>
        <p className="voice-page-preview-hint">
          When &quot;Push transcript to chat input&quot; is enabled in Settings,
          this text receives the normalized transcript before classification.
        </p>
        <textarea
          className="voice-page-textarea"
          readOnly
          value={previewText}
          placeholder="Mock transcript appears here…"
          aria-label="Transcript preview"
        />
      </section>
    </div>
  );
}
