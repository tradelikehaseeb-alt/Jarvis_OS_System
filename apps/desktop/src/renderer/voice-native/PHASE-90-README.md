# Phase 90 — Desktop Voice-Native UI

Command center switches to voice-native layout when `voiceSettings.voiceNativeUi` is true (default).

## Components

- `LiveSpeechOrb` replaces `AIStatusOrb` during voice-native mode
- `StreamingVoiceOverlay` shows partial STT + streaming TTS text
- `VoiceInterruptController` stops assistant speech (barge-in)

## Settings (`voice-settings.ts`)

- `listeningMode`: `push-to-talk` | `continuous` | `wake-word`
- `wakeWordEnabled` / `wakePhrase` (default: `jarvis`)
- `voiceNativeUi`: enables cinematic voice layout

Capture remains mock STT (`runMockVoiceCapture`) until real microphone adapters ship.
