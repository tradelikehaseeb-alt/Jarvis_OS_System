# Desktop voice shell (Phase 25–38, 72)

> **Voice-native mode (default):** use `voice-native/` when `voiceNativeUi: true`.  
> This module is the **legacy** shell when voice-native is disabled.

## Flow (Chat)

```
Voice Input → Speech Runtime → Intent Classification → API → Orchestrator
  → Hermes/OpenClaw → Execution Lifecycle → Activity Stream → Desktop Response
```

## When to use

| Setting | UI |
|---------|-----|
| `voiceNativeUi: true` | `LiveSpeechOrb`, `StreamingVoiceOverlay` (Phase 90+) |
| `voiceNativeUi: false` | `VoiceShell`, `VoiceTranscriptPanel` (this module) |

## Components

| Piece | Role |
|-------|------|
| `useMockVoiceInput` | Timer-based mock capture state |
| `useVoiceExecution` | Voice → speech → API task pipeline (Phase 72) |
| `VoiceButton` | Microphone toggle |
| `VoiceTranscriptPanel` | Original + normalized transcript, corrections |
| `VoiceShell` | Composes voice UI (`full` or `chat` variant) |

## Real microphone

When `useRealMicrophone: true`, `useVoiceSession` in `voice-native/` handles capture — not this mock shell.

See [`../../../../docs/VOICE.md`](../../../../docs/VOICE.md).

## Settings (`localStorage`: `jarvis.desktop.voiceSettings`)

See `voice-settings.ts` for full list. Key flags:

- `showTranscriptPanel`, `pushToChatInput`, `enableNormalization`
- `autoExecuteVoicePipeline` (default on)
- `voiceNativeUi`, `useRealMicrophone`

## Tests

```bash
npm run test --workspace=@jarvis/desktop -- --run src/renderer/voice
```
