# Phase 90 — Desktop Voice-Native UI

Command center switches to voice-native layout when `voiceSettings.voiceNativeUi` is true (default).

## Components

- `LiveSpeechOrb` — replaces `AIStatusOrb` in voice-native mode (Phase 92: Framer Motion + memoized waveform)
- `StreamingVoiceOverlay` — partial STT + streaming TTS text
- `VoiceInterruptController` — barge-in during assistant speech

## Settings (`voice/voice-settings.ts`)

| Setting | Default |
|---------|---------|
| `voiceNativeUi` | `true` |
| `listeningMode` | `push-to-talk` |
| `wakeWordEnabled` | `true` |
| `wakePhrase` | `jarvis` |

## Capture

Phase **91** added real microphone (`useRealMicrophone: true`, default). Set `useRealMicrophone: false` for mock/timer capture (tests).

## Docs

- Phase 91: `PHASE-91-README.md`
- Phase 92 polish: `../polish/PHASE-92-README.md`
- [`../../../../docs/VOICE.md`](../../../../docs/VOICE.md)
