import type { EnvSource } from "./hermes-runtime-env";
import {  isHermesAgentApiFailureText,
  isHermesAgentNetworkError,
  isHermesAgentRateLimitError,
  type RunHermesAgentProcessOptions,
  type RunHermesAgentProcessResult,
  runHermesAgentProcess,
} from "./hermes-python-process-runner";

const DEFAULT_GEMINI_SKILLS_MODEL = "gemini-2.0-flash";

function resolveGeminiApiKey(env: EnvSource): string {
  return (
    env.GEMINI_API_KEY?.trim() ||
    env.JARVIS_GEMINI_API_KEY?.trim() ||
    env.GOOGLE_API_KEY?.trim() ||
    ""
  );
}

function resolveGeminiSkillsModel(env: EnvSource): string {
  return (
    env.GEMINI_MODEL?.trim() ||
    env.JARVIS_GEMINI_MODEL?.trim() ||
    env.HERMES_INFERENCE_MODEL?.trim() ||
    DEFAULT_GEMINI_SKILLS_MODEL
  );
}

/**
 * Env overrides that force `run_agent.py` to resolve Gemini instead of Groq.
 */
export function buildGeminiSkillsProcessEnv(
  env: EnvSource,
): NodeJS.ProcessEnv | undefined {
  const apiKey = resolveGeminiApiKey(env);
  if (!apiKey) {
    return undefined;
  }

  const model = resolveGeminiSkillsModel(env);
  return {
    HERMES_INFERENCE_PROVIDER: "gemini",
    GEMINI_API_KEY: apiKey,
    GOOGLE_API_KEY: apiKey,
    HERMES_INFERENCE_MODEL: model,
  };
}

/**
 * True when the skills subprocess failed due to provider rate limits or transport errors.
 */
export function isHermesSkillsProviderFailure(
  result: RunHermesAgentProcessResult,
): boolean {
  if (result.success) {
    return false;
  }

  return (
    isHermesAgentRateLimitError(result.stderr, result.stdout) ||
    isHermesAgentNetworkError(result) ||
    (result.finalResponse ? isHermesAgentApiFailureText(result.finalResponse) : false) ||
    result.errorCode === "HERMES_AGENT_TIMEOUT" ||
    result.errorCode === "HERMES_AGENT_INIT_FAILED"
  );
}

/**
 * Re-run the Hermes skills subprocess using Gemini credentials (full skills path, not chat-only).
 */
export async function runHermesAgentProcessWithGemini(
  options: RunHermesAgentProcessOptions,
  env: EnvSource,
): Promise<RunHermesAgentProcessResult | undefined> {
  const geminiEnv = buildGeminiSkillsProcessEnv(env);
  if (!geminiEnv) {
    return undefined;
  }

  console.info("[hermes-python] retrying skills subprocess with Gemini provider runtime");

  return runHermesAgentProcess({
    ...options,
    env: {
      ...(options.env ?? process.env),
      ...geminiEnv,
    },
    maxRetries: 0,
  });
}
