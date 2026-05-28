# Phase 91 — Real-Time Voice Runtime

Replaces mock capture with real microphone + streaming STT/TTS when configured.

## Modules (`real-time/`)

| Module | Role |
|--------|------|
| `MicrophoneRuntime` | Mic capture contract + `SyntheticMicrophoneRuntime` |
| `StreamingSpeechRuntime` | Mic → partial STT → final transcript |
| `RealTimeTranscriptionSession` | Partial/final events + confidence/latency |
| `VoicePlaybackController` | Interruptible streaming TTS |
| `TtsProviderRuntime` | Ordered TTS fallback chain |

## STT providers

`whisper`, `deepgram`, `groq-whisper`, `openai-realtime` — live when API keys exist, stub fallback otherwise.

## TTS providers

`elevenlabs`, `openai-tts`, `edge-tts` — same fallback behavior.

## Env keys

`OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `GROQ_API_KEY`, `ELEVENLABS_API_KEY` (+ `JARVIS_*` variants).

## Desktop

`BrowserMicrophoneRuntime` uses `getUserMedia` + Web Audio; falls back to synthetic mic in tests.

Set `voiceSettings.useRealMicrophone = false` to keep Phase 25 mock capture.
