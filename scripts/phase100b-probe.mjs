/**
 * Phase 100B end-to-end probe — embedded API, Groq, Playwright workflow.
 * Run: npx tsx scripts/phase100b-probe.mjs
 */
import { loadJarvisEnv } from "../apps/desktop/src/load-env.ts";
import { createDefaultJarvisApiServer } from "../services/api-runtime/src/index.ts";
import { createDefaultOrchestratorService } from "../services/orchestrator/src/index.ts";
import { createDefaultProviderValidationRuntime } from "../services/orchestrator/src/llm-provider/connectors/index.ts";
import { isRealBrowserExecutionEnabled } from "../agents/openclaw/src/execution-runtime/browser-real-mode.ts";
import { tryLaunchPlaywrightPage } from "../agents/openclaw/src/execution-runtime/create-playwright-browser-action-pipeline.ts";

const WORKFLOW_COMMAND = "Jarvis open YouTube and search AI news";

async function main() {
  const envPath = loadJarvisEnv(process.cwd());
  console.log("=== PHASE 100B PROBE ===");
  console.log("env file:", envPath ?? "NOT FOUND");
  console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? `SET (${process.env.GROQ_API_KEY.length} chars)` : "MISSING");
  console.log("JARVIS_BROWSER_REAL:", process.env.JARVIS_BROWSER_REAL ?? "false");
  console.log("");

  // Priority 1 — Embedded API
  console.log("--- Priority 1: Embedded API ---");
  const orchestrator = await createDefaultOrchestratorService();
  const server = await createDefaultJarvisApiServer({
    port: Number(process.env.JARVIS_API_RUNTIME_PORT ?? 8787),
    orchestrator,
  });
  const started = await server.start();
  console.log("API endpoint:", started.url);

  const health = await server.fetch("/health");
  console.log("GET /health:", health.status, JSON.stringify(health.json));

  const create = await server.fetch("/tasks", {
    method: "POST",
    body: {
      intent: { kind: "automate", description: WORKFLOW_COMMAND },
      metadata: { source: "phase100b-probe" },
    },
  });
  console.log("POST /tasks:", create.status, JSON.stringify(create.json));

  if (create.status !== 200 || !create.json?.taskId) {
    console.error("FAIL: task creation failed");
    await server.stop();
    process.exit(1);
  }

  const status = await server.fetch(`/tasks/${create.json.taskId}`);
  console.log("GET /tasks/:id status:", status.json?.status);
  const output = status.json?.output ?? {};
  const llm = output.llmProvider ?? {};
  console.log("llmProvider:", JSON.stringify(llm, null, 2));
  console.log("browserState:", JSON.stringify(output.executionRuntime?.browserState ?? output.browserState ?? null));

  // Priority 2 — Groq direct
  console.log("");
  console.log("--- Priority 2: Groq provider ---");
  if (!process.env.GROQ_API_KEY) {
    console.error("FAIL: GROQ_API_KEY not configured — cannot continue to real LLM");
  } else {
    const runtime = createDefaultProviderValidationRuntime();
    const groq = await runtime.executePrompt({
      providerId: "groq",
      prompt: "Reply with exactly: Groq is live",
      userId: "phase100b",
    });
    console.log("Groq direct:", {
      success: groq.success,
      stub: groq.stub,
      latencyMs: groq.latencyMs,
      preview: groq.content.slice(0, 120),
    });
    if (groq.stub) {
      console.error("FAIL: Groq still stub");
    }
  }

  // Priority 3 — Playwright
  console.log("");
  console.log("--- Priority 3: Playwright ---");
  console.log("real browser enabled:", isRealBrowserExecutionEnabled());
  const page = await tryLaunchPlaywrightPage();
  console.log("Playwright launch:", page ? "OK" : "FAIL");
  if (page) {
    await page.goto("https://www.youtube.com", { timeout: 30000 });
    const title = await page.title();
    console.log("YouTube title:", title);
    console.log("YouTube url:", page.url());
  }

  console.log("");
  console.log("--- Workflow verdict ---");
  const workflowStub = llm.stub === true;
  const browserStub = (output.executionRuntime?.browserState ?? output.browserState)?.stub !== false;
  console.log("LLM stub:", llm.stub);
  console.log("Task status:", status.json?.status);
  console.log("Real workflow achieved:", !workflowStub && status.json?.status === "completed" ? "PARTIAL/UNKNOWN" : "NO");

  await server.stop();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
