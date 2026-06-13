import { vi } from "vitest";

import type { JarvisDesktopApi } from "../global";

const defaultReadyState = {
  phase: "ready" as const,
  ready: true,
  initialized: true,
  validated: true,
  recovered: false,
  processCount: 6,
  healthyProcessCount: 6,
  failedProcesses: [] as string[],
  message: "Runtime ready",
  updatedAt: "2026-05-27T12:00:00.000Z",
};

const defaultAggregatedHealthResponse = {
  health: {
    status: "healthy" as const,
    components: [
      { componentId: "hermes" as const, label: "Hermes", healthy: true, state: "running" },
      { componentId: "openclaw" as const, label: "OpenClaw", healthy: true, state: "running" },
      { componentId: "speech" as const, label: "Speech", healthy: true, state: "running" },
      { componentId: "memory" as const, label: "Memory", healthy: true, state: "running" },
      { componentId: "api" as const, label: "API Runtime", healthy: true, state: "running" },
      {
        componentId: "orchestrator" as const,
        label: "Orchestrator",
        healthy: true,
        state: "running",
      },
    ],
    startupPhase: "ready" as const,
    recoveryState: "none" as const,
    checkedAt: "2026-05-27T12:00:00.000Z",
    healthyCount: 6,
    totalCount: 6,
  },
  progress: {
    phase: "ready" as const,
    percent: 100,
    ready: true,
    message: "Runtime ready",
  },
  events: [] as const,
};

export const defaultProviderSettingsSnapshot = {
  settings: {
    userId: "desktop-user",
    selectedProviderId: "openai",
    selectedModels: { openai: "gpt-4o-mini" },
    updatedAt: "2026-05-27T12:00:00.000Z",
  },
  providers: [
    {
      providerId: "openai",
      label: "OpenAI",
      kind: "openai" as const,
      configured: false,
      valid: false,
      stub: true,
      active: true,
      message: "OpenAI API key not configured — stub fallback active",
      selectedModel: "gpt-4o-mini",
      availableModels: ["gpt-4o-mini", "gpt-4o"],
    },
    {
      providerId: "groq",
      label: "Groq",
      kind: "groq" as const,
      configured: false,
      valid: false,
      stub: true,
      active: false,
      message: "Groq API key not configured — stub fallback active",
      selectedModel: "llama-3.3-70b-versatile",
      availableModels: ["llama-3.3-70b-versatile"],
    },
  ],
};

const defaultApiKeyValidation = {
  valid: true,
  providerId: "openai",
  stub: false,
  message: "OpenAI API key configured",
};

const defaultStartupResponse = {
  state: defaultReadyState,
  events: [] as const,
  apiBaseUrl: "http://127.0.0.1:8787",
};

/**
 * Shared Jarvis desktop bridge mock for renderer tests.
 */
export function createMockJarvisApi(
  overrides: Partial<JarvisDesktopApi> = {},
): JarvisDesktopApi {
  return {
    getApiUrl: vi.fn().mockResolvedValue("http://127.0.0.1:8787"),
    checkApiHealth: vi.fn().mockResolvedValue({
      status: "ok",
      service: "jarvis-api-runtime",
      orchestrator: "ok",
      checkedAt: "2026-05-27T12:00:00.000Z",
    }),
    getRuntimeHealth: vi.fn().mockResolvedValue({
      health: {
        status: "healthy",
        processCount: 4,
        runningCount: 4,
        failedCount: 0,
        checkedAt: "2026-05-27T12:00:00.000Z",
      },
      processes: [],
    }),
    executeRuntimeAction: vi.fn(),
    initializeRuntime: vi.fn().mockResolvedValue(defaultStartupResponse),
    validateRuntime: vi.fn().mockResolvedValue(defaultStartupResponse),
    recoverRuntime: vi.fn().mockResolvedValue(defaultStartupResponse),
    getStartupStatus: vi.fn().mockResolvedValue(defaultStartupResponse),
    getHermesStartupStatus: vi.fn().mockResolvedValue({
      connected: true,
      label: "Hermes: Connected ✅",
      detail: "Python agent (mock)",
      adapterId: "hermes-adapter-python",
      agentRoot: "",
    }),
    speechInit: vi.fn().mockResolvedValue({
      ready: true,
      sttEngine: "Groq Whisper ✅",
      ttsEngine: "Edge TTS ✅",
      ttsVoice: "en-US-GuyNeural",
      groqConfigured: true,
      message: "Speech engines ready",
    }),
    speechTranscribe: vi.fn().mockResolvedValue({
      output: "hello jarvis",
      confidence: 0.9,
    }),
    speechSpeak: vi.fn().mockResolvedValue({
      output: "Hello I am Jarvis",
      audioBase64: "",
      mimeType: "audio/mpeg",
    }),
    getAggregatedRuntimeHealth: vi.fn().mockResolvedValue(defaultAggregatedHealthResponse),
    getAggregatedRuntimeHealthSnapshot: vi
      .fn()
      .mockResolvedValue(defaultAggregatedHealthResponse),
    createTask: vi.fn(),
    getTaskStatus: vi.fn(),
    getProviderSettings: vi.fn().mockResolvedValue(defaultProviderSettingsSnapshot),
    saveProviderApiKey: vi.fn().mockResolvedValue(defaultApiKeyValidation),
    validateProviderApiKey: vi.fn().mockResolvedValue(defaultApiKeyValidation),
    selectProvider: vi.fn().mockResolvedValue(defaultProviderSettingsSnapshot.settings),
    selectProviderModel: vi.fn().mockResolvedValue(defaultProviderSettingsSnapshot.settings),
    syncClientLocale: vi.fn().mockResolvedValue({
      timeZone: "Asia/Karachi",
      locale: "en-US",
      cityLabel: "Karachi",
    }),
    ...overrides,
  };
}
