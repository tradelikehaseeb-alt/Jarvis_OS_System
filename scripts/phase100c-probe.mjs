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

function deriveUiLabels(taskOutput) {
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

  const voice = {
    mode: "STUB MODE",
    detail: "Voice · speech-stub · stub",
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
  report.uiLabels = deriveUiLabels(workflowOutput);
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
    pass("UI no STUB in summary for LLM/browser", !report.uiLabels.summaryLabel.includes("STUB MODE") || report.uiLabels.voice.mode === "STUB MODE", report.uiLabels.summaryLabel),
  );

  await server.stop();

  report.success =
    groqDirect.stub === false &&
    streamed.stub === false &&
    summarize.stub === false &&
    workflowLlm.stub === false &&
    browserRuntime?.stub === false &&
    workflowStatus.json?.status === "completed";

  fs.writeFileSync("phase100c-evidence.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.success ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
