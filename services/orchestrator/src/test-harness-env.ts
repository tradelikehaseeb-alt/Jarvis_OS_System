/**
 * Applies deterministic env for orchestrator unit/integration tests.
 * Used by vitest.setup and {@link createTestOrchestratorService}.
 */
export function applyOrchestratorTestHarnessEnv(
  env: NodeJS.ProcessEnv = process.env,
): void {
  env.SERPER_API_KEY ??= "vitest-serper-mock-key";
  env.JARVIS_ALLOW_LLM_STUB_FALLBACK = "true";
  delete env.JARVIS_BROWSER_REAL;

  env.HERMES_MODE = "stub";
  delete env.HERMES_PLANNING_ADAPTER;
  delete env.HERMES_USE_PYTHON_AGENT;
  env.HERMES_INTEGRATION_LIVE = "false";

  env.OPENCLAW_MODE ??= "stub";
  env.ORCHESTRATOR_EXECUTE_COMPOSED_WORKFLOW = "false";
  env.SPEECH_FORCE_STUB_COMPONENTS ??= "true";

  if (env.RUN_INTEGRATION_LIVE_TESTS !== "true") {
    const keys = [
      "GROQ_API_KEY",
      "JARVIS_GROQ_API_KEY",
      "OPENAI_API_KEY",
      "JARVIS_OPENAI_API_KEY",
      "GEMINI_API_KEY",
      "JARVIS_GEMINI_API_KEY",
      "GOOGLE_API_KEY",
      "OPENROUTER_API_KEY",
      "JARVIS_OPENROUTER_API_KEY",
      "DEEPSEEK_API_KEY",
      "JARVIS_DEEPSEEK_API_KEY",
    ] as const;
    for (const key of keys) {
      delete env[key];
    }
  }
}
