/**
 * Phase 100C — first real AI response validation.
 * Run: npx tsx scripts/phase100c-probe.mjs
 *
 * Requires repo-root .env with GROQ_API_KEY.
 */
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple paths to find .env
const envPaths = [
  resolve(__dirname, "../.env"),
  resolve(__dirname, "../../.env"),
  resolve(process.cwd(), ".env"),
];

let envLoaded = false;
let envPath = null;

for (const p of envPaths) {
  const result = dotenv.config({ path: p });
  if (!result.error) {
    envLoaded = true;
    envPath = p;
    break;
  }
}

console.log("ENV PATH TRIED:", envPaths);
console.log("ENV LOADED:", envLoaded, "→", envPath);
console.log("GROQ KEY:", !!process.env.GROQ_API_KEY);

import fs from "node:fs";
import { createDefaultJarvisApiServer } from "../services/api-runtime/src/index.ts";
import { createDefaultOrchestratorService } from "../services/orchestrator/src/index.ts";
import {
  createDefaultProviderValidationRuntime,
  createDefaultProviderSettingsRuntime,
  GROQ_PROVIDER_ID,
} from "../services/orchestrator/src/llm-provider/connectors/index.ts";
import { createDefaultProviderHealthValidationRuntime } from "../services/orchestrator/src/llm-provider/provider-health/index.ts";
import { DEFAULT_API_USER_ID } from "../services/orchestrator/src/task-execution/create-task-executor.ts";
import { SearchSkill, SEARCH_SKILL_ID } from "../skills/search-skill/src/index.ts";
import { GroqWhisperSttAdapter } from "../services/speech-service/src/adapters/live-stt-adapters.ts";
import { createDefaultTtsProviderRuntime } from "../services/speech-service/src/real-time/tts-provider-runtime.ts";

const PORT = Number(process.env.JARVIS_API_RUNTIME_PORT ?? 8792);
const AI_PROMPT = "Summarize today's AI news";
const WORKFLOW = "Open YouTube and search AI news";

function extractBrowserRuntime(output) {
  const agentPayload = output?.agentPayload;
  return (
    output?.browserRuntime ??
    agentPayload?.browserRuntime ??
    output?.executionRuntime?.browserRuntime ??
    output?.openclaw?.browserRuntime ??
    null
  );
}

function extractBrowserState(output) {
  const runtime = extractBrowserRuntime(output);
  return (
    runtime?.browserState ??
    output?.executionRuntime?.browserState ??
    output?.browserState ??
    null
  );
}

function deriveUiLabels(taskOutput, voiceProbe = {}) {
  const llmProvider = taskOutput?.llmProvider ?? {};
  const browserState =
    taskOutput?.executionRuntime?.browserState ??
    taskOutput?.agentPayload?.browserRuntime?.browserState ??
    taskOutput?.openclaw?.browserState ??
    taskOutput?.browserState ??
    {};

  const llmStub = llmProvider.stub === true || Object.keys(llmProvider).length === 0;
  const llmProviderId = llmProvider.providerId ?? "none";
  const llmLatency =
    typeof llmProvider.latencyMs === "number"
      ? `${Math.round(llmProvider.latencyMs)}ms`
      : "—";

  const llm = {
    mode: llmStub ? "STUB MODE" : "REAL MODE",
    detail: llmStub
      ? `LLM · ${llmProviderId} · stub`
      : `LLM · ${llmProviderId} · ${llmLatency}`,
  };

  const browserActive = browserState.active === true;
  const browserStub = browserState.stub !== false || !browserActive;
  const browserUrl = browserState.url;
  const browser = {
    mode: browserStub ? "SIMULATED MODE" : "REAL MODE",
    detail: browserStub
      ? browserUrl
        ? `Browser · simulated · ${browserUrl}`
        : "Browser · simulated"
      : browserUrl
        ? `Browser · live · ${browserUrl}`
        : "Browser · live",
  };

  const sttLive = voiceProbe.stt?.stub === false && !voiceProbe.stt?.error;
  const ttsLive = voiceProbe.tts?.stub === false && Boolean(voiceProbe.tts?.audioBase64);
  const voiceStub = !(sttLive && ttsLive);
  const sttProvider = voiceProbe.stt?.providerId ?? "speech-stub";
  const voice = {
    mode: voiceStub ? "STUB MODE" : "REAL MODE",
    detail: voiceStub
      ? `Voice · ${sttProvider} · stub`
      : `Voice · ${sttProvider} · ${Math.round(voiceProbe.stt?.latencyMs ?? 0)}ms`,
  };

  const summaryLabel = `${llm.mode} · ${browser.mode} · ${voice.mode}`;

  return { llm, browser, voice, summaryLabel };
}

function pass(label, ok, detail) {
  return { label, ok, detail };
}

async function main() {
  const report = {
    phase: "100C",
    at: new Date().toISOString(),
    port: PORT,
    checks: [],
    success: false,
  };

  report.envPath = envPath;
  report.envLoaded = envLoaded;
  report.groqKeyLoaded = Boolean(process.env.GROQ_API_KEY);
  report.groqKeyLength = process.env.GROQ_API_KEY?.length ?? 0;
  report.jars = {
    JARVIS_LLM_PROVIDER: process.env.JARVIS_LLM_PROVIDER ?? null,
    JARVIS_ALLOW_LLM_STUB_FALLBACK: process.env.JARVIS_ALLOW_LLM_STUB_FALLBACK ?? null,
    JARVIS_BROWSER_REAL: process.env.JARVIS_BROWSER_REAL ?? null,
    JARVIS_BROWSER_HEADLESS: process.env.JARVIS_BROWSER_HEADLESS ?? null,
  };

  report.checks.push(
    pass(".env loading", envLoaded, report.envPath ?? "NOT FOUND"),
  );
  report.checks.push(
    pass(
      "GROQ_API_KEY loading",
      report.groqKeyLoaded,
      report.groqKeyLoaded ? `set (${report.groqKeyLength} chars)` : "MISSING",
    ),
  );

  if (!process.env.GROQ_API_KEY) {
    report.blocker = "GROQ_API_KEY missing — create .env from .env.example";
    report.success = false;
    fs.writeFileSync("phase100c-evidence.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  // --- 1. Groq integration ---
  const healthRuntime = createDefaultProviderHealthValidationRuntime();
  const groqHealth = await healthRuntime.validateProviderHealth(
    GROQ_PROVIDER_ID,
    DEFAULT_API_USER_ID,
  );
  report.groqHealth = groqHealth;
  report.checks.push(
    pass(
      "provider health",
      groqHealth.connected && !groqHealth.stub,
      groqHealth.message,
    ),
  );

  const validationRuntime = createDefaultProviderValidationRuntime();
  const groqDirect = await validationRuntime.executePrompt({
    providerId: GROQ_PROVIDER_ID,
    prompt: "Reply with exactly: Groq is live",
    userId: "phase100c",
  });
  report.groqDirect = {
    providerId: groqDirect.providerId,
    model: groqDirect.model,
    stub: groqDirect.stub,
    success: groqDirect.success,
    latencyMs: groqDirect.latencyMs,
    preview: groqDirect.content.slice(0, 200),
  };
  report.checks.push(pass("executePrompt stub=false", groqDirect.stub === false, String(groqDirect.stub)));
  report.checks.push(pass("executePrompt providerId=groq", groqDirect.providerId === GROQ_PROVIDER_ID, groqDirect.providerId));
  report.checks.push(pass("executePrompt latencyMs", typeof groqDirect.latencyMs === "number", String(groqDirect.latencyMs)));

  const streamChunks = [];
  const streamed = await validationRuntime.streamResponse(
    {
      providerId: GROQ_PROVIDER_ID,
      prompt: "Say hello in one short sentence.",
      userId: "phase100c",
    },
    {
      subscriberId: "phase100c-stream",
      onChunk: (chunk) => {
        streamChunks.push(chunk);
      },
    },
  );
  report.groqStream = {
    stub: streamed.stub,
    success: streamed.success,
    latencyMs: streamed.latencyMs,
    chunkCount: streamChunks.length,
    preview: streamed.content.slice(0, 200),
  };
  report.checks.push(pass("streamResponse stub=false", streamed.stub === false, String(streamed.stub)));
  report.checks.push(pass("stream chunks received", streamChunks.length > 0, String(streamChunks.length)));

  // --- 2. First real AI prompt (direct Groq) ---
  const summarize = await validationRuntime.executePrompt({
    providerId: GROQ_PROVIDER_ID,
    prompt: AI_PROMPT,
    userId: "phase100c",
  });
  report.aiPrompt = {
    providerId: summarize.providerId,
    model: summarize.model,
    stub: summarize.stub,
    success: summarize.success,
    latencyMs: summarize.latencyMs,
    preview: summarize.content.slice(0, 200),
  };
  report.checks.push(pass("AI prompt stub=false", summarize.stub === false, String(summarize.stub)));
  report.checks.push(pass("AI prompt providerId=groq", summarize.providerId === GROQ_PROVIDER_ID, summarize.providerId));
  report.checks.push(pass("AI prompt latencyMs", typeof summarize.latencyMs === "number", String(summarize.latencyMs)));

  // --- 2b. Search (Serper) ---
  const searchSkill = new SearchSkill();
  const searchOutput = await searchSkill.execute(
    {
      invocationId: "phase100c-search",
      skillId: SEARCH_SKILL_ID,
      agentId: "hermes",
      userId: "phase100c",
      parameters: { query: "latest AI news" },
    },
    { contextRef: "phase100c", userId: "phase100c", agentId: "hermes" },
  );
  const searchResults = searchOutput.data?.results ?? [];
  const firstSearchUrl = searchResults[0]?.url ?? "";
  report.search = {
    stub: searchOutput.data?.stub,
    success: searchOutput.success,
    total: searchOutput.data?.total ?? 0,
    firstUrl: firstSearchUrl,
    error: searchOutput.error?.code,
  };
  report.checks.push(pass("SearchSkill stub=false", searchOutput.data?.stub === false, String(searchOutput.data?.stub)));
  report.checks.push(
    pass("SearchSkill real URLs", searchResults.length > 0 && !firstSearchUrl.includes("stub.local"), firstSearchUrl || "none"),
  );

  // --- 2c. TTS (Edge) + STT (Groq Whisper) ---
  const ttsRuntime = createDefaultTtsProviderRuntime();
  const ttsResponse = await ttsRuntime.synthesize({
    requestId: "phase100c-tts",
    text: "Hello Jarvis voice check.",
  });
  report.tts = {
    providerId: ttsResponse.providerId,
    stub: ttsResponse.stub,
    audioBytes: ttsResponse.audioBase64?.length ?? 0,
    error: ttsResponse.error?.code,
  };
  report.checks.push(pass("TTS stub=false", ttsResponse.stub === false, String(ttsResponse.stub)));
  report.checks.push(
    pass("TTS audio buffer returned", (ttsResponse.audioBase64?.length ?? 0) > 100, String(ttsResponse.audioBase64?.length ?? 0)),
  );

  const sttResponse = await GroqWhisperSttAdapter.transcribe({
    requestId: "phase100c-stt",
    text: "",
    audioBase64: ttsResponse.audioBase64 ?? "",
    mimeType: ttsResponse.mimeType ?? "audio/mpeg",
  });
  report.stt = {
    providerId: sttResponse.providerId,
    stub: sttResponse.stub,
    preview: sttResponse.output.slice(0, 80),
    latencyMs: sttResponse.latencyMs,
    error: sttResponse.error?.code,
  };
  report.checks.push(pass("STT stub=false", sttResponse.stub === false, String(sttResponse.stub)));
  report.checks.push(
    pass("STT provider=groq-whisper", sttResponse.providerId === "groq-whisper", sttResponse.providerId),
  );
  report.checks.push(pass("STT transcript received", sttResponse.output.length > 0, sttResponse.output.slice(0, 40)));

  const voiceProbe = { stt: sttResponse, tts: ttsResponse };

  // --- 3. Browser + AI combined via API ---
  process.env.JARVIS_BROWSER_REAL = process.env.JARVIS_BROWSER_REAL ?? "true";
  const orchestrator = await createDefaultOrchestratorService();
  const server = await createDefaultJarvisApiServer({ port: PORT, orchestrator });
  const started = await server.start();
  report.apiEndpoint = started.url;

  const workflowTask = await server.fetch("/tasks", {
    method: "POST",
    body: {
      intent: { kind: "automate", description: WORKFLOW },
      metadata: { source: "phase100c", llmProviderId: GROQ_PROVIDER_ID },
    },
  });
  const workflowStatus = await server.fetch(`/tasks/${workflowTask.json.taskId}`);
  const workflowOutput = workflowStatus.json?.output ?? {};
  const workflowLlm = workflowOutput.llmProvider ?? {};
  const browserRuntime = extractBrowserRuntime(workflowOutput);
  const browserState = extractBrowserState(workflowOutput);

  report.workflow = {
    taskId: workflowTask.json.taskId,
    status: workflowStatus.json?.status,
    llmProvider: {
      providerId: workflowLlm.providerId,
      model: workflowLlm.model,
      stub: workflowLlm.stub,
      latencyMs: workflowLlm.latencyMs,
      preview: (workflowLlm.contentPreview ?? "").slice(0, 200),
    },
    browserRuntime: browserRuntime
      ? { stub: browserRuntime.stub, success: browserRuntime.success, url: browserRuntime.url }
      : null,
    browserState,
    workflowProgress: browserRuntime?.workflowProgress ?? workflowOutput.openclaw?.workflowProgress,
  };

  report.checks.push(pass("workflow llm stub=false", workflowLlm.stub === false, String(workflowLlm.stub)));
  report.checks.push(
    pass("workflow browserRuntime stub=false", browserRuntime?.stub === false, String(browserRuntime?.stub)),
  );
  report.checks.push(
    pass("workflow completed", workflowStatus.json?.status === "completed", workflowStatus.json?.status),
  );

  // --- 4. UI labels (derived from task output) ---
  report.uiLabels = deriveUiLabels(workflowOutput, voiceProbe);
  report.checks.push(
    pass("UI LLM REAL MODE", report.uiLabels.llm.mode === "REAL MODE", report.uiLabels.llm.detail),
  );
  report.checks.push(
    pass("UI shows Groq", report.uiLabels.llm.detail.includes("groq"), report.uiLabels.llm.detail),
  );
  report.checks.push(
    pass("UI latency visible", !report.uiLabels.llm.detail.endsWith("stub"), report.uiLabels.llm.detail),
  );
  report.checks.push(
    pass("UI browser REAL MODE", report.uiLabels.browser.mode === "REAL MODE", report.uiLabels.browser.detail),
  );
  report.checks.push(
    pass("UI voice REAL MODE", report.uiLabels.voice.mode === "REAL MODE", report.uiLabels.voice.detail),
  );
  report.checks.push(
    pass("UI summary all REAL", report.uiLabels.summaryLabel === "REAL MODE · REAL MODE · REAL MODE", report.uiLabels.summaryLabel),
  );

  report.integrationModes = {
    hermesMode: process.env.HERMES_MODE ?? "stub",
    openclawMode: process.env.OPENCLAW_MODE ?? "stub",
    memoryBackend: process.env.JARVIS_MEMORY_BACKEND ?? "memory-service",
    orchestratorLlmPlanning: process.env.JARVIS_ALLOW_ORCHESTRATOR_LLM_PLANNING ?? "false",
  };
  report.checks.push(
    pass(
      "Hermes mode configured",
      Boolean(report.integrationModes.hermesMode),
      report.integrationModes.hermesMode,
    ),
  );
  report.checks.push(
    pass(
      "OpenClaw mode configured",
      Boolean(report.integrationModes.openclawMode),
      report.integrationModes.openclawMode,
    ),
  );

  if (process.env.HERMES_INTEGRATION_LIVE === "true") {
    const { createHermesAdapterOfficial } = await import(
      "../agents/hermes/adapter/official/src/hermes-adapter-official.ts"
    );
    const hermesAdapter = createHermesAdapterOfficial();
    const hermesPlan = await hermesAdapter.invoke(
      {
        requestId: "probe-hermes",
        taskId: "probe-hermes-task",
        userId: DEFAULT_API_USER_ID,
        intent: { kind: "plan", description: "Plan integration validation" },
      },
      { adapterId: "hermes-adapter-official", mode: "official" },
    );
    report.hermesOfficial = { stub: hermesPlan.stub, success: hermesPlan.success };
    report.checks.push(
      pass("Hermes official plan", hermesPlan.success && hermesPlan.stub === false, hermesPlan.error?.message),
    );
  }

  await server.stop();

  report.success =
    groqDirect.stub === false &&
    streamed.stub === false &&
    summarize.stub === false &&
    searchOutput.data?.stub === false &&
    searchOutput.success === true &&
    ttsResponse.stub === false &&
    (ttsResponse.audioBase64?.length ?? 0) > 0 &&
    sttResponse.stub === false &&
    sttResponse.providerId === "groq-whisper" &&
    workflowLlm.stub === false &&
    browserRuntime?.stub === false &&
    workflowStatus.json?.status === "completed" &&
    report.uiLabels.summaryLabel === "REAL MODE · REAL MODE · REAL MODE";

  fs.writeFileSync("phase100c-evidence.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.success ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
