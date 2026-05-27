# Desktop voice shell (Phase 25–38, 72)

UI-only mock voice capture — **no STT, TTS, or microphone APIs**.

## Flow (Chat)

```
Voice Input → Speech Runtime → Intent Classification → API → Orchestrator
  → Hermes/OpenClaw → Execution Lifecycle → Activity Stream → Desktop Response
```

Legacy path preserved: mock capture → chat input → manual Send.

## Components

| Piece | Role |
|-------|------|
| `useMockVoiceInput` | Timer-based mock capture state |
| `useVoiceExecution` | Voice → speech → API task pipeline (Phase 72) |
| `runMockVoiceCapture` | Produces static transcript lines |
| `VoiceButton` | Microphone toggle |
| `VoiceStatusIndicator` | idle / listening / processing / error |
| `VoiceTranscriptPanel` | Original + normalized transcript, corrections, listening wave |
| `VoiceShell` | Composes voice UI (`full` or `chat` variant) |

## Settings (`localStorage`)

- Show transcript panel in Chat
- Push transcript to chat input
- Enable speech normalization before intent classification
- Auto-execute voice pipeline through Jarvis runtime (Phase 72, default on)
- Simulate capture error (UI testing)

## Normalization (Phase 27)

- Uses `@jarvis/speech-service` `SpeechNormalizer`
- Deterministic text rules only (Roman Urdu + English)
- Shows:
  - **Original transcript**
  - **Normalized transcript**
  - **Corrections applied** rule ids
- Toggle in Settings can disable normalization (pass-through behavior)
- Includes dedicated `normalizing` loading status in the voice indicator/panel

## Speech metadata panel (Phase 38)

Voice transcript panel now also shows deterministic gateway metadata:

- **detected action**
- **normalized transcript**
- **conversation state**
- **provider decision**
- **trace summary**

## Voice execution (Phase 72)

`useVoiceExecution()` supports:

- `startVoiceExecution()` / `stopVoiceExecution()`
- `processVoiceInput()` — speech normalize + `submitChatAsTask` + activity stream ingest

When `autoExecuteVoicePipeline` is enabled, voice completion triggers the full chain automatically.

## Future integration

Replace `runMockVoiceCapture` with a real STT adapter; keep the same hook surface and components.
