# Phase 90 — Voice-Native Jarvis Experience

Voice-native layer on top of existing `voice → API → orchestrator` execution chain.

## Modules

### `@jarvis/speech-service`

- `VoiceSessionRuntime` — session lifecycle, wake word, streaming speech, interruption
- `WakeWordState` — `idle | armed | triggered` with `detectWakeWord()`
- Reuses `VoiceExecutionRuntime`, `SpeechStreamManager`, `SpeechConversationManager`

### `@jarvis/orchestrator`

- `createOrchestratorVoiceSessionRuntime()` — wires session runtime to `executeCreateTask`

### `@jarvis/desktop`

- `LiveSpeechOrb` — central animated orb + waveform
- `StreamingVoiceOverlay` — live partial transcript + streaming response
- `VoiceInterruptController` — barge-in while speaking
- `useVoiceSession` — React hook over `VoiceSessionRuntime`

## Modes

| Mode | Behavior |
|------|----------|
| `push-to-talk` | Toggle mic to capture (default) |
| `continuous` | Re-listens after each cycle |
| `wake-word` | Requires wake phrase before command |

## User-facing states

Listening → Thinking → Executing → Speaking (no Hermes/OpenClaw labels in UI).

## Architecture preserved

UI → API → Orchestrator → Agents → Skills — voice session delegates to existing task APIs only.

## Phase 91+

Real-time STT/TTS: `src/real-time/` — see `PHASE-91-README.md`.

## Phase 92

Transcript stabilization and natural word timing: `src/real-time/speech-timing.ts`.

## Docs

- Desktop: `apps/desktop/src/renderer/voice-native/PHASE-90-README.md`
- [`../../../../docs/VOICE.md`](../../../../docs/VOICE.md)
