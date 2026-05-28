# @jarvis/speech-service

**Speech runtime for Jarvis** — normalization, voice sessions, real-time STT/TTS, and voice→task execution.

**Current:** Phase **92** (timing + transcript stabilization). Tests: **84**.

## Quick reference

| Capability | Module | Desktop wired? |
|------------|--------|----------------|
| Roman Urdu + English normalization | `normalization/` | ✅ |
| Voice session (wake word, interrupt) | `voice-session/` | ✅ |
| Real-time mic + streaming STT/TTS | `real-time/` | ✅ Phase 91 |
| Natural speech timing + stable partials | `real-time/speech-timing.ts` | ✅ Phase 92 |
| Voice execution delegate | `voice-execution/` | ✅ |

Docs: [`../../docs/VOICE.md`](../../docs/VOICE.md) · Phase READMEs: `src/real-time/PHASE-91-README.md`, `src/voice-session/PHASE-90-README.md`

## Pipeline (normalization)

```
transcript text
  → LanguageDetector
  → TranscriptCorrection (domain-aware)
  → NormalizationRules (language-aware)
  → normalized transcript
```

## Real-time voice (Phase 91+)

```
MicrophoneRuntime → StreamingSpeechRuntime → RealTimeTranscriptionSession
  → VoicePlaybackController → TtsProviderRuntime
```

STT: `whisper`, `deepgram`, `groq-whisper`, `openai-realtime`  
TTS: `elevenlabs`, `openai-tts`, `edge-tts`  
Stub fallback when API keys missing.

---

## Modules (full index)

| Module | Role |
|--------|------|
| `SpeechContext` | Optional locale/domain hints |
| `LanguageDetector` | Heuristic `en` / `ur-roman` / `mixed` detection |
| `TranscriptCorrection` | STT homophone fixes (e.g. trading) |
| `NormalizationRules` | Roman Urdu phrase/word → English |
| `SpeechNormalizer` | Orchestrates the pipeline |
| `adapters/*` | Provider abstraction layer (stub-only in Phase 28) |
| `runtime/*` | Provider runtime status/health manager (stub-only in Phase 29) |
| `routing/*` | Capability-based provider selection (stub metadata only, Phase 30) |
| `session/*` | In-memory speech session orchestration (deterministic, Phase 31) |
| `events/*` | In-memory event bus + stream session foundation (deterministic, Phase 32) |
| `conversation/*` | In-memory conversation + interruption management (Phase 33) |
| `actions/*` | Deterministic speech action routing + command handlers (Phase 34) |
| `gateway/*` | Single-entry speech provider gateway over existing layers (Phase 36) |
| `telemetry/*` | In-memory deterministic traces + metrics (Phase 37) |
| `recovery/*` | Deterministic failure recovery + fallback selection (Phase 39) |
| `contracts/*` | Frozen provider contract + compatibility validation (Phase 40) |
| `voice-execution/*` | Voice → speech → task execution runtime (Phase 72) |

## Phase 72 — voice execution runtime

Voice input flows through speech gateway/normalizer, then optional task delegate (`createDefaultVoiceExecutionRuntime`).

## Pipeline

```
transcript text
  → LanguageDetector
  → TranscriptCorrection (domain-aware)
  → NormalizationRules (language-aware)
  → normalized transcript
```

## Usage

```typescript
import { normalizeTranscript } from "@jarvis/speech-service";

const result = normalizeTranscript("for eggs analysis", { domain: "trading" });
console.log(result.normalized); // "forex analysis"

const urdu = normalizeTranscript("mera gold ka chart kholo");
console.log(urdu.normalized); // "open my gold chart"
```

## Examples

| Input | Output (typical) |
|-------|------------------|
| `for eggs analysis` (trading) | `forex analysis` |
| `mera gold ka chart kholo` | `open my gold chart` |

## Constraints

- **Deterministic** normalization rules — extend `TRANSCRIPT_CORRECTION_RULES` and `NORMALIZATION_RULES`
- STT/TTS adapters use stub fallback without keys (CI-safe)
- Task execution stays in orchestrator — speech-service does not call agents directly

## Desktop integration

- Voice-native: `apps/desktop/src/renderer/voice-native/use-voice-session.ts`
- Legacy shell: `apps/desktop/src/renderer/voice/useMockVoiceInput.ts`
- Polish re-exports: `apps/desktop/src/renderer/polish/transcript-stabilizer.ts`

Integration tests:

- `src/__tests__/speech-service-integration.test.ts`
- `apps/desktop/src/renderer/voice/__tests__/voice-gateway-pipeline.integration.test.ts`
- `apps/desktop/src/renderer/voice-native/__tests__/voice-session.integration.test.ts`

## Tests

```bash
npm run test --workspace=@jarvis/speech-service   # 84 tests
npm run build --workspace=@jarvis/speech-service
```

---

## Historical module index (Phases 26–40)

## Speech Adapter Architecture (Phase 28)

```
Voice UI
  ↓
Speech Service
  ↓
Speech Adapter
  ↓
Future providers
```

New adapter module (`src/adapters/`) provides:

- `SpeechToTextAdapter`
- `TextToSpeechAdapter`
- `SpeechProviderConfig`
- `SpeechRequest`
- `SpeechResponse`
- `SpeechAdapterRegistry`
- `StubSpeechToTextAdapter`
- `StubTextToSpeechAdapter`

## Speech Runtime Manager (Phase 29)

```
Voice UI
  ↓
Speech Service
  ↓
Speech Adapter
  ↓
Speech Runtime Manager
  ↓
Future providers
```

Runtime module (`src/runtime/`) provides:

- `SpeechRuntimeStatus`
- `SpeechRuntimeHealth`
- `SpeechRuntimeProvider`
- `MockSpeechRuntimeProvider`
- `SpeechRuntimeManager`
- `InMemorySpeechRuntimeManager`
- `SpeechRuntimeResolver`
- `createDefaultSpeechRuntimeResolver()`

Supported provider ids:

- `stt-local`
- `stt-cloud`
- `tts-local`
- `tts-cloud`

Default deterministic mock health:

- `stt-local` → `available`
- `tts-local` → `available`
- `stt-cloud` → `degraded`
- `tts-cloud` → `degraded`

## Speech Capability Routing (Phase 30)

```
Voice UI
  ↓
Speech Service
  ↓
Speech Adapter
  ↓
Speech Runtime Manager
  ↓
Speech Capability Router
  ↓
Future providers
```

Routing module (`src/routing/`) provides:

- `SpeechCapability`
- `SpeechCapabilityMatch`
- `SpeechRoutingDecision`
- `SpeechSelectionPolicy`
- `DefaultSpeechSelectionPolicy`
- `SpeechCapabilityResolver`
- `SpeechCapabilityRouter`
- `createDefaultSpeechCapabilityRouter()`

Capabilities:

- `low-latency`
- `offline`
- `multilingual`
- `roman-urdu`
- `high-quality`
- `streaming-ready`

Deterministic examples:

- Roman Urdu → `stt-local`
- English high-quality → `stt-cloud`
- Low latency → local providers

## Speech Session Manager (Phase 31)

```
Voice UI
  ↓
Speech Service
  ↓
Speech Session Manager
  ↓
Speech Adapter
  ↓
Speech Runtime Manager
  ↓
Speech Capability Router
  ↓
Future providers
```

Session module (`src/session/`) provides:

- `SpeechSessionState`
- `SpeechSession`
- `SpeechSessionEvent`
- `SpeechSessionManager`
- `InMemorySpeechSessionManager`
- `SpeechSessionFactory`
- `createDefaultSpeechSessionManager()`

Supported states:

- `idle`
- `listening`
- `processing`
- `speaking`
- `completed`
- `error`

## Speech Event Bus & Stream Foundation (Phase 32)

```
Voice UI
  ↓
Speech Service
  ↓
Speech Event Bus
  ↓
Speech Session Manager
  ↓
Speech Adapter
  ↓
Speech Runtime Manager
  ↓
Speech Capability Router
  ↓
Future providers
```

Event module (`src/events/`) provides:

- `SpeechEventType`
- `SpeechEvent`
- `SpeechEventListener`
- `SpeechEventBus`
- `InMemorySpeechEventBus`
- `SpeechStreamChunk`
- `SpeechStreamSession`
- `SpeechStreamManager`
- `createDefaultSpeechEventBus()`

Event types:

- `session-created`
- `listening-started`
- `transcript-partial`
- `transcript-final`
- `normalization-completed`
- `processing-started`
- `speaking-started`
- `session-completed`
- `error`

## Speech Conversation Context & Interruption Manager (Phase 33)

```
Voice UI
  ↓
Speech Service
  ↓
Speech Conversation Manager
  ↓
Speech Event Bus
  ↓
Speech Session Manager
  ↓
Speech Adapter
  ↓
Speech Runtime Manager
  ↓
Speech Capability Router
  ↓
Future providers
```

Conversation module (`src/conversation/`) provides:

- `SpeechConversation`
- `SpeechConversationState`
- `SpeechConversationTurn`
- `SpeechConversationContext`
- `SpeechInterruptionEvent`
- `SpeechConversationManager`
- `InMemorySpeechConversationManager`
- `createDefaultSpeechConversationManager()`

Supported states:

- `active`
- `interrupted`
- `paused`
- `completed`

## Speech Action Pipeline & Voice Command Routing (Phase 34)

```
Transcript
  ↓
Normalizer
  ↓
Conversation Context
  ↓
Speech Action Router
  ↓
Action Handler
  ↓
Response
```

Actions module (`src/actions/`) provides:

- `SpeechAction`
- `SpeechActionType`
- `SpeechActionRequest`
- `SpeechActionResponse`
- `SpeechActionHandler`
- `SpeechActionRegistry`
- `InMemorySpeechActionRegistry`
- `SpeechActionRouter`
- `createDefaultSpeechActionRouter()`

Supported commands:

- `stop`
- `continue`
- `repeat`
- `cancel`
- `help`
- `open-settings`

## Speech Provider Gateway Layer (Phase 36)

```
SpeechConversation
  ↓
SpeechActionRouter
  ↓
SpeechGateway
  ↓
SpeechAdapter
  ↓
SpeechRuntimeManager
  ↓
SpeechCapabilityRouter
```

Gateway module (`src/gateway/`) provides:

- `SpeechGatewayRequest`
- `SpeechGatewayResponse`
- `SpeechGateway`
- `DefaultSpeechGateway`
- `SpeechGatewayFactory`
- `createDefaultSpeechGateway()`

Gateway support:

- `processTranscript()`
- `processAction()`
- `resolveProvider()`
- `getRuntimeHealth()`

## Speech Telemetry & Trace System (Phase 37)

```
Voice UI
  ↓
Speech Service
  ↓
Telemetry
  ↓
Gateway
  ↓
Adapters
  ↓
Runtime Manager
  ↓
Capability Router
```

Telemetry module (`src/telemetry/`) provides:

- `SpeechTraceLevel`
- `SpeechTraceEvent`
- `SpeechTraceContext`
- `SpeechMetrics`
- `SpeechTelemetryCollector`
- `InMemorySpeechTelemetryCollector`
- `SpeechTraceRecorder`
- `createDefaultSpeechTelemetry()`

Supported operations:

- `recordEvent()`
- `recordMetric()`
- `getTraceHistory()`
- `clearHistory()`

## Speech Recovery & Fallback System (Phase 39)

```
SpeechGateway
  ↓
RecoveryManager
  ↓
RuntimeManager
  ↓
Fallback provider
  ↓
Response
```

Recovery module (`src/recovery/`) provides:

- `SpeechRecoveryReason`
- `SpeechRecoveryAction`
- `SpeechRecoveryEvent`
- `SpeechFallbackProvider`
- `SpeechRecoveryManager`
- `InMemorySpeechRecoveryManager`
- `createDefaultSpeechRecoveryManager()`

Recovery reasons:

- `provider-unavailable`
- `timeout`
- `invalid-response`
- `routing-failure`
- `interrupted-session`

Actions:

- `retry`
- `fallback`
- `continue`
- `terminate`

Supported operations:

- `handleFailure()`
- `selectFallback()`
- `retryOperation()`
- `getRecoveryHistory()`

## Speech Provider Contracts & Compatibility Matrix (Phase 40)

Contract module (`src/contracts/`) provides:

- `SpeechContractVersion`
- `SpeechProviderContract`
- `SpeechProviderCapabilities`
- `SpeechCompatibilityResult`
- `SpeechContractValidator`
- `createDefaultSpeechContractValidator()`

Provider metadata:

- `providerId`
- `version`
- `capabilities`
- `runtimeRequirements`
- `stub`

Supported operations:

- `validateProvider()`
- `validateCompatibility()`
- `getSupportedVersions()`

## Phase 38+ Desktop integration

Desktop voice pipeline wires `@jarvis/speech-service` gateway + telemetry. Phase 91+ adds real-time STT/TTS via `voice-native/`. See [`../../docs/VOICE.md`](../../docs/VOICE.md).
