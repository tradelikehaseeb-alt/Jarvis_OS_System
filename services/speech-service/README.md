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

## Tests

```bash
npm run test --workspace=@jarvis/speech-service
npm run build --workspace=@jarvis/speech-service
```
