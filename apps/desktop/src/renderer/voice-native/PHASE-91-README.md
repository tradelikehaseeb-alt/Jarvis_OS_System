# Phase 91 — Desktop Real-Time Voice

When `useRealMicrophone: true` (default), `useVoiceSession` wires:

- `BrowserMicrophoneRuntime` → `StreamingSpeechRuntime`
- `createRealTimeVoiceCaptureDelegate` / `createRealTimeVoiceSpeechDelegate`
- Live waveform, confidence, and STT latency in `LiveSpeechOrb` + `StreamingVoiceOverlay`

Execution still flows through `submitChatAsTask` → orchestrator.
