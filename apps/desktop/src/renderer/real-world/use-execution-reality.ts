import { useMemo } from "react";

import type { VoiceSettings } from "../voice/voice-settings";

export type ExecutionModeLabel = "REAL MODE" | "STUB MODE" | "SIMULATED MODE";

export interface ExecutionRealitySlice {
  readonly mode: ExecutionModeLabel;
  readonly detail: string;
}

export interface UseExecutionRealityOptions {
  readonly taskOutput?: Readonly<Record<string, unknown>>;
  readonly voiceSettings?: VoiceSettings;
  readonly sttProviderId?: string;
  readonly sttStub?: boolean;
  readonly sttLatencyMs?: number;
}

export interface UseExecutionRealityResult {
  readonly llm: ExecutionRealitySlice;
  readonly browser: ExecutionRealitySlice;
  readonly voice: ExecutionRealitySlice;
  readonly summaryLabel: string;
}

function readRecord(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  return value && typeof value === "object"
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function formatLatency(latencyMs: unknown): string {
  return typeof latencyMs === "number" && Number.isFinite(latencyMs)
    ? `${Math.round(latencyMs)}ms`
    : "—";
}

/**
 * Derives honest REAL / STUB / SIMULATED labels for command center (Phase 100A).
 */
export function useExecutionReality(
  options: UseExecutionRealityOptions = {},
): UseExecutionRealityResult {
  return useMemo(() => {
    const llmProvider = readRecord(options.taskOutput?.llmProvider);
    const executionRuntime = readRecord(options.taskOutput?.executionRuntime);
    const browserState =
      readRecord(executionRuntime?.browserState) ??
      readRecord(options.taskOutput?.browserState);

    const llmStub = llmProvider?.stub === true || llmProvider === undefined;
    const llmProviderId =
      typeof llmProvider?.providerId === "string" ? llmProvider.providerId : "none";
    const llmLatency = formatLatency(llmProvider?.latencyMs);

    const llm: ExecutionRealitySlice = {
      mode: llmStub ? "STUB MODE" : "REAL MODE",
      detail: llmStub
        ? `LLM · ${llmProviderId} · stub`
        : `LLM · ${llmProviderId} · ${llmLatency}`,
    };

    const browserActive = browserState?.active === true;
    const browserStub = browserState?.stub !== false || !browserActive;
    const browserUrl =
      typeof browserState?.url === "string" ? browserState.url : undefined;

    const browser: ExecutionRealitySlice = {
      mode: browserStub ? "SIMULATED MODE" : "REAL MODE",
      detail: browserStub
        ? browserUrl
          ? `Browser · simulated · ${browserUrl}`
          : "Browser · simulated"
        : browserUrl
          ? `Browser · live · ${browserUrl}`
          : "Browser · live",
    };

    const voiceUsesRealMic = options.voiceSettings?.useRealMicrophone ?? false;
    const voiceStub = options.sttStub ?? !voiceUsesRealMic;
    const sttProvider =
      options.sttProviderId ??
      options.voiceSettings?.sttProviderId ??
      (voiceStub ? "speech-stub" : "auto");

    const voice: ExecutionRealitySlice = {
      mode: voiceStub ? "STUB MODE" : "REAL MODE",
      detail: voiceStub
        ? `Voice · ${sttProvider} · stub`
        : `Voice · ${sttProvider} · ${formatLatency(options.sttLatencyMs)}`,
    };

    const summaryLabel = `${llm.mode} · ${browser.mode} · ${voice.mode}`;

    return { llm, browser, voice, summaryLabel };
  }, [
    options.sttLatencyMs,
    options.sttProviderId,
    options.sttStub,
    options.taskOutput,
    options.voiceSettings,
  ]);
}
