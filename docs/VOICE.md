# Voice & Speech Runtime

Jarvis voice flows through `@jarvis/speech-service` and desktop hooks — **never** bypassing API/Orchestrator for task execution.

## Architecture

```
Desktop UI
  → useVoiceSession / useMockVoiceInput
  → @jarvis/speech-service (normalize, session, real-time STT/TTS)
  → IntentClassifier
  → POST /tasks (API)
  → Orchestrator → Hermes / OpenClaw
  → Activity stream + streaming response → Desktop UI
```

## Modes

| Mode | Setting | Behavior |
|------|---------|----------|
| **Voice-native (default)** | `voiceNativeUi: true` | `LiveSpeechOrb`, `StreamingVoiceOverlay`, interrupt controller |
| **Legacy voice shell** | `voiceNativeUi: false` | `VoiceShell`, `VoiceTranscriptPanel`, mock timer capture |
| **Real microphone** | `useRealMicrophone: true` | `BrowserMicrophoneRuntime` + streaming STT (Phase 91) |
| **Mock capture** | `useRealMicrophone: false` | Synthetic mic / timer transcripts (tests, offline UI) |

Settings: `apps/desktop/src/renderer/voice/voice-settings.ts`

## Desktop components

| Component | Phase | Role |
|-----------|-------|------|
| `LiveSpeechOrb` | 90, 92 | Animated orb + waveform + confidence |
| `StreamingVoiceOverlay` | 90, 92 | Partial transcript + progressive streaming text |
| `VoiceInterruptController` | 90, 92 | Barge-in during TTS playback |
| `useVoiceSession` | 90–92 | Session state, throttled mic levels, stable partials |
| `BrowserMicrophoneRuntime` | 91 | `getUserMedia` + Web Audio analyser |
| `WaveformBars` / `ProgressiveStreamText` | 92 | Memoized waveform + word fade-in |
| `VoiceTranscriptPanel` | 25–38 | Legacy transcript + normalization display |

## Speech service modules

| Module | Path | Role |
|--------|------|------|
| Normalization | `src/normalization/` | Roman Urdu + English, homophone fixes |
| Voice session | `src/voice-session/` | States: idle, listening, thinking, speaking, executing |
| Real-time | `src/real-time/` | Mic, streaming STT, TTS playback, timing |
| Voice execution | `src/voice-execution/` | Speech → task delegate |

### Real-time STT providers

| ID | Env key | Notes |
|----|---------|-------|
| `whisper` | `OPENAI_API_KEY` | OpenAI Whisper |
| `deepgram` | `DEEPGRAM_API_KEY` | Streaming |
| `groq-whisper` | `GROQ_API_KEY` | Groq Whisper |
| `openai-realtime` | `OPENAI_API_KEY` | Realtime API (stub fallback without key) |

### TTS providers

| ID | Env key |
|----|---------|
| `elevenlabs` | `ELEVENLABS_API_KEY` |
| `openai-tts` | `OPENAI_API_KEY` |
| `edge-tts` | _(no key — Edge TTS)_ |

Without keys, adapters fall back to deterministic stub streaming.

## Phase 92 polish

| Feature | Module | Effect |
|---------|--------|--------|
| Transcript stabilization | `speech-timing.ts` | Less partial STT flicker |
| Natural word timing | `naturalWordDelayMs()` | Lower perceived TTS latency |
| Throttled mic levels | `useThrottledMicLevels` | Fewer React rerenders |
| Framer Motion | orb, overlay, chat, execution panel | Smoother transitions |

## Orchestrator bridge

`services/orchestrator/src/speech-realtime/` connects streaming speech events to task execution lifecycle. Desktop still submits tasks via API — orchestrator does not receive raw mic audio from the renderer.

## Listening modes

- **push-to-talk** — hold/toggle mic (default)
- **continuous** — always listening after start
- **wake-word** — gated on wake phrase (`jarvis` default)

## Tests

```bash
npm run test --workspace=@jarvis/speech-service
npm run test --workspace=@jarvis/desktop -- --run src/renderer/voice-native
npm run test --workspace=@jarvis/desktop -- --run src/renderer/polish
npm run test --workspace=@jarvis/orchestrator -- --run src/speech-realtime
```

## Related docs

- Phase 90: `apps/desktop/src/renderer/voice-native/PHASE-90-README.md`
- Phase 91: `services/speech-service/src/real-time/PHASE-91-README.md`
- Phase 92: `apps/desktop/src/renderer/polish/PHASE-92-README.md`
- Phase 97 workforce UI: `apps/desktop/src/renderer/workforce/`
- Legacy shell: `apps/desktop/src/renderer/voice/README.md`

## Voice + workforce (Phase 97)

Voice commands that trigger multi-step research or automation intents (e.g. "research AI news and prepare a brief") flow through the same API → orchestrator pipeline. Progress appears as user-facing labels (**Researching…**, **Analyzing…**, **Completed.**) in the command center — never internal agent names.

## Voice + productivity (Phase 98)

Productivity voice intents (`mapVoiceTranscriptToProductivityIntent`) detect email, scheduling, research, and task-organization commands. Follow-up phrases (`and then`, `also`) enable smoother multi-step productivity sessions.

## Voice + continuous runtime (Phase 99)

Continuous voice intents (`mapVoiceTranscriptToContinuousIntent`) support monitor/watch/remind/background commands with proactive spoken notifications. Wake-word readiness and interruption-aware background speech integrate through the existing voice session pipeline.
