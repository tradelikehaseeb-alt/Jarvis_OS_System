# Phase 91 — Desktop Real-Time Voice

When `useRealMicrophone: true` (default), `useVoiceSession` wires:

- `BrowserMicrophoneRuntime` → `StreamingSpeechRuntime`
- `createRealTimeVoiceCaptureDelegate` / `createRealTimeVoiceSpeechDelegate`
- Live waveform, confidence, and STT latency in `LiveSpeechOrb` + `StreamingVoiceOverlay`

Execution still flows through `submitChatAsTask` → orchestrator.

## Phase 92 additions

- `useStablePartialTranscript` — debounced partial text
- `useThrottledMicLevels` — 120ms throttle on waveform updates
- Confidence display: `{N}% confident`

## Tests

```bash
npm run test --workspace=@jarvis/desktop -- --run src/renderer/voice-native
npm run test --workspace=@jarvis/speech-service -- --run src/real-time
```

## Docs

- Speech service: `services/speech-service/src/real-time/PHASE-91-README.md`
- [`../../../../docs/VOICE.md`](../../../../docs/VOICE.md)
- [`../../../../docs/PROVIDERS.md`](../../../../docs/PROVIDERS.md)
