/**
 * Smoke-test task execution with JARVIS_EXECUTION_TRACE (no Electron UI required).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

async function main(): Promise<void> {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  process.chdir(repoRoot);
  process.env.JARVIS_EXECUTION_TRACE = "true";
  process.env.ORCHESTRATOR_EXECUTE_COMPOSED_WORKFLOW = "true";

  const { loadJarvisEnv } = await import("../apps/desktop/src/load-env.ts");
  const { ensureElectronMemoryBackend } = await import(
    "../apps/desktop/src/ensure-electron-memory-backend.ts"
  );

  loadJarvisEnv(repoRoot);
  process.versions.electron = process.versions.electron ?? "42.3.2";
  ensureElectronMemoryBackend();

  const { createDefaultOrchestratorService } = await import(
    "../services/orchestrator/src/index.ts"
  );

  const orchestrator = await createDefaultOrchestratorService();
  const userId = "smoke-user";

  const tasks = [
    { description: "hello", kind: "chat" as const },
    { description: "plan my week", kind: "plan" as const },
    {
      description: "open youtube and search ai news",
      kind: "automate" as const,
    },
  ];

  console.info("[smoke] memory backend:", process.env.JARVIS_MEMORY_BACKEND);
  console.info(
    "[smoke] electron modules:",
    process.versions.modules,
    "electron:",
    process.versions.electron,
  );

  for (const intent of tasks) {
    console.info("\n[smoke] === TASK:", intent.description, "===");
    const { record } = await orchestrator.executeCreateTask({
      userId,
      intent,
    });
    console.info(
      "[smoke] result:",
      JSON.stringify({
        taskId: record.createTaskResponse.taskId,
        status: record.createTaskResponse.status,
        message: record.taskStatus.message,
      }),
    );
  }
}

void main().catch((error) => {
  console.error("[smoke] failed:", error);
  process.exit(1);
});
