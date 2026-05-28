# Phase 92 — Jarvis Quality & Responsiveness

Polish pass: motion, latency perception, performance — **no new runtime layers**.

## Desktop (`polish/`)

| Module | Purpose |
|--------|---------|
| `motion-presets.ts` | Shared Framer Motion variants |
| `WaveformBars.tsx` | Memoized orb waveform |
| `ProgressiveStreamText.tsx` | Word-by-word fade-in for streaming |
| `use-stable-partial-transcript.ts` | 120ms debounced partial STT |
| `use-throttled-value.ts` | Throttled mic level updates |
| `transcript-stabilizer.ts` | Re-exports from `@jarvis/speech-service` |

## Updated components

- `LiveSpeechOrb`, `StreamingVoiceOverlay`, `VoiceInterruptController`
- `LiveExecutionPanel`, `ChatMessages`, `DynamicActivityPanel`

## Speech service

- `speech-timing.ts` — `naturalWordDelayMs()`, `stabilizePartialTranscript()`
- `VoicePlaybackController` uses variable per-word timing

## Styles

- `styles/polish.css` — spacing tokens, ambient glow, telemetry row

## Tests

```bash
npm run test --workspace=@jarvis/desktop -- --run src/renderer/polish
npm run test --workspace=@jarvis/speech-service -- --run src/real-time/__tests__/speech-timing
```

**Suite totals (Phase 92):** desktop 180 · speech-service 84 · orchestrator 243

## Test / CI toggles

```json
{ "useRealMicrophone": false, "voiceNativeUi": false }
```

in `localStorage` key `jarvis.desktop.voiceSettings`.

## Docs

- [`../../../../docs/PROJECT_STATUS.md`](../../../../docs/PROJECT_STATUS.md)
- [`../../../../docs/screenshots/README.md`](../../../../docs/screenshots/README.md)
