/**
 * Quick Phase 100B evidence collector (no Electron).
 */
import fs from "node:fs";
import { loadJarvisEnv } from "../apps/desktop/src/load-env.ts";
import { createDefaultJarvisApiServer } from "../services/api-runtime/src/index.ts";
import { createDefaultOrchestratorService } from "../services/orchestrator/src/index.ts";
import { tryLaunchPlaywrightPage } from "../agents/openclaw/src/execution-runtime/create-playwright-browser-action-pipeline.ts";
import { isRealBrowserExecutionEnabled } from "../agents/openclaw/src/execution-runtime/browser-real-mode.ts";

const PORT = Number(process.env.JARVIS_API_RUNTIME_PORT ?? 8790);
const WORKFLOW = "Jarvis open YouTube and search AI news";

async function main() {
  const report = { at: new Date().toISOString(), port: PORT };

  report.envPath = loadJarvisEnv(process.cwd()) ?? null;
  report.groqKey = process.env.GROQ_API_KEY ? `set(${process.env.GROQ_API_KEY.length})` : "missing";
  report.browserReal = process.env.JARVIS_BROWSER_REAL ?? "false";
  report.browserHeadless = process.env.JARVIS_BROWSER_HEADLESS ?? "true(default)";
  report.realBrowserEnabled = isRealBrowserExecutionEnabled();

  const page = await tryLaunchPlaywrightPage();
  report.playwrightDirect = page ? "ok" : "fail";
  if (page) {
    try {
      await page.goto("https://www.youtube.com", { timeout: 20000 });
      report.youtubeTitle = await page.title();
      report.youtubeUrl = page.url();
    } catch (error) {
      report.playwrightNavError = error instanceof Error ? error.message : String(error);
    }
  }

  const orchestrator = await createDefaultOrchestratorService();
  const server = await createDefaultJarvisApiServer({ port: PORT, orchestrator });
  const started = await server.start();
  report.apiEndpoint = started.url;

  const health = await server.fetch("/health");
  report.health = health.json;

  const create = await server.fetch("/tasks", {
    method: "POST",
    body: {
      intent: { kind: "automate", description: WORKFLOW },
      metadata: { source: "phase100b-quick" },
    },
  });
  report.createTask = create.json;

  const status = await server.fetch(`/tasks/${create.json.taskId}`);
  report.taskStatus = status.json?.status;
  report.llmProvider = status.json?.output?.llmProvider ?? null;
  report.browserState =
    status.json?.output?.executionRuntime?.browserState ??
    status.json?.output?.browserState ??
    null;
  report.openclaw = status.json?.output?.openclaw ?? status.json?.output?.executionRuntime ?? null;
  report.fullOutput = status.json?.output ?? null;

  await server.stop();

  const outPath = "phase100b-evidence.json";
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
