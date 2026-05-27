# @jarvis/speech-service

**Speech transcript normalization** (Phase 26) — deterministic text cleanup for Roman Urdu + English mixed voice input.

Prepares transcripts **before** future STT integration. No STT, TTS, microphone APIs, or LLM calls.

## Modules

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

- **Text in / text out** only
- **Deterministic** rule tables — extend `TRANSCRIPT_CORRECTION_RULES` and `NORMALIZATION_RULES`
- Not wired to Desktop or API yet — consume from voice/STT layer in a later phase
- Adapter layer is **stub-only** in this phase (no microphone/device permissions, no external STT/TTS APIs)

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

## Tests

```bash
npm run test --workspace=@jarvis/speech-service
npm run build --workspace=@jarvis/speech-service
```

## Phase 38 Desktop integration

Desktop voice pipeline now wires `@jarvis/speech-service` gateway + telemetry internally via `useMockVoiceInput`.
No API, orchestrator, or Hermes/OpenClaw changes.

Integration coverage:

- `src/__tests__/speech-service-integration.test.ts` (service-level)
- `apps/desktop/src/renderer/voice/__tests__/voice-gateway-pipeline.integration.test.ts` (desktop hook)

`src/__tests__/speech-service-integration.test.ts` validates deterministic in-memory integration flow:

1. Normal conversation flow  
   Transcript → `SpeechNormalizer` → `ConversationManager` → `SpeechActionRouter` → `SpeechEventBus` → `SpeechSessionManager` → response/session complete
2. Interruption flow  
   Start conversation → interrupt → resume → complete
3. Voice command flow  
   `stop`, `repeat`, `open-settings`
4. Transcript normalization flow  
   Roman Urdu + English behavior, correction/rule application, conversation metadata preservation
5. Failure flow  
   Invalid action, invalid session, invalid conversation
