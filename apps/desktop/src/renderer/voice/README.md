# Desktop voice shell (Phase 25–27)

UI-only mock voice capture — **no STT, TTS, or microphone APIs**.

## Flow (Chat)

```
Mic click → listening animation → mock transcript
  → SpeechNormalizer (optional, deterministic rules)
  → IntentClassifier → ChatInput → POST /tasks (unchanged API)
```

## Components

| Piece | Role |
|-------|------|
| `useMockVoiceInput` | Timer-based mock capture state |
| `runMockVoiceCapture` | Produces static transcript lines |
| `VoiceButton` | Microphone toggle |
| `VoiceStatusIndicator` | idle / listening / processing / error |
| `VoiceTranscriptPanel` | Original + normalized transcript, corrections, listening wave |
| `VoiceShell` | Composes voice UI (`full` or `chat` variant) |

## Settings (`localStorage`)

- Show transcript panel in Chat
- Push transcript to chat input
- Enable speech normalization before intent classification
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

## Future integration

Replace `runMockVoiceCapture` with a real STT adapter; keep the same hook surface and components.
