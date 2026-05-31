import type { HermesAdapter } from "../../src/hermes-adapter";
import type { HermesConfig } from "../../src/hermes-config";
import type { HermesRequest } from "../../src/hermes-request";
import type { HermesResponse } from "../../src/hermes-response";
import { buildHermesStructuredPlan, toStructuredPlanJson } from "./hermes-structured-plan";
import {
  hasGroqCredentialsForHermesAgent,
  resolveHermesAgentRoot,
  runHermesAgentProcess,
} from "./hermes-python-process-runner";
import { readHermesRuntimeEnv, type EnvSource } from "./hermes-runtime-env";

export const HERMES_PYTHON_ADAPTER_ID = "hermes-adapter-python" as const;

export interface HermesAdapterPythonOptions {
  readonly env?: EnvSource;
  readonly agentRoot?: string;
  readonly timeoutMs?: number;
}

function failure(
  adapterId: string,
  request: HermesRequest,
  code: string,
  message: string,
): HermesResponse {
  return {
    success: false,
    adapterId,
    stub: false,
    plan: {
      goal: "",
      steps: [],
      intentKind: request.intent.kind,
      summary: "",
    },
    reasoning: { summary: "", confidence: 0 },
    error: { code, message },
  };
}

function buildQuery(request: HermesRequest): string {
  const description = request.intent.description.trim();
  const contextCount = request.recalledContextSnippets?.length ?? 0;
  const contextBlock =
    contextCount > 0
      ? `\n\nRecalled context (${contextCount} items):\n${(request.recalledContextSnippets ?? [])
          .slice(0, 5)
          .map((snippet, index) => `${index + 1}. ${snippet}`)
          .join("\n")}`
      : "";

  return [
    `You are Jarvis OS Hermes planning layer.`,
    `Intent kind: ${request.intent.kind}`,
    `Task: ${description || "(no description)"}`,
    `Produce a concise numbered plan the orchestrator can execute via Jarvis skills.`,
    `Do not claim actions were already executed.`,
    contextBlock,
  ]
    .filter(Boolean)
    .join("\n");
}

function stepsFromAgentText(
  request: HermesRequest,
  finalResponse: string,
): readonly string[] {
  const lines = finalResponse
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[\d\-*.)]+\s*/, "").trim())
    .filter((line) => line.length > 0);

  if (lines.length >= 2) {
    return lines.slice(0, 12);
  }

  const fallback = buildHermesStructuredPlan(request);
  if (finalResponse.length > 0) {
    return [...fallback.steps, `Agent insight: ${finalResponse.slice(0, 400)}`];
  }

  return fallback.steps;
}

/**
 * Real Hermes adapter — spawns `hermes-agent/run_agent.py` and parses `FINAL RESPONSE:`.
 */
export class HermesAdapterPython implements HermesAdapter {
  readonly adapterId: string;
  private readonly env: EnvSource;
  private readonly agentRoot: string;
  private readonly timeoutMs: number;

  constructor(options: HermesAdapterPythonOptions = {}) {
    this.env = options.env ?? process.env;
    this.adapterId = HERMES_PYTHON_ADAPTER_ID;
    this.agentRoot =
      options.agentRoot?.trim() || resolveHermesAgentRoot(this.env);
    this.timeoutMs = options.timeoutMs ?? 120_000;
  }

  async invoke(
    request: HermesRequest,
    config?: HermesConfig,
  ): Promise<HermesResponse> {
    const adapterId = config?.adapterId ?? this.adapterId;

    if (config?.mode === "stub") {
      return failure(
        adapterId,
        request,
        "PYTHON_ADAPTER_MODE_MISMATCH",
        "HermesAdapterPython cannot run in stub mode",
      );
    }

    if (!this.agentRoot) {
      return failure(
        adapterId,
        request,
        "HERMES_AGENT_PATH_MISSING",
        "Set HERMES_AGENT_PATH or HERMES_PATH to the hermes-agent directory",
      );
    }

    if (!hasGroqCredentialsForHermesAgent(this.env)) {
      return failure(
        adapterId,
        request,
        "GROQ_API_KEY_MISSING",
        "Set GROQ_API_KEY for Hermes Python agent (Groq via ~/.hermes or env)",
      );
    }

    const runtime = readHermesRuntimeEnv(this.env);
    const processResult = await runHermesAgentProcess({
      agentRoot: this.agentRoot,
      query: buildQuery(request),
      timeoutMs: this.timeoutMs,
      env: this.env as NodeJS.ProcessEnv,
    });

    if (!processResult.success || !processResult.finalResponse) {
      return failure(
        adapterId,
        request,
        processResult.errorCode ?? "HERMES_AGENT_FAILED",
        processResult.errorMessage ??
          "Hermes Python agent did not return a final response",
      );
    }

    const structured = buildHermesStructuredPlan(request);
    const steps = stepsFromAgentText(request, processResult.finalResponse);
    const planJson = toStructuredPlanJson({
      ...structured,
      goal: structured.goal || request.intent.description.trim(),
      steps,
    });

    return {
      success: true,
      adapterId,
      stub: false,
      plan: {
        ...planJson,
        intentKind: request.intent.kind,
        summary: processResult.finalResponse.slice(0, 500),
      },
      reasoning: {
        summary: `Hermes Python agent (${runtime.mode}) — ${processResult.finalResponse.slice(0, 280)}`,
        confidence: 0.92,
      },
    };
  }
}

export function createHermesAdapterPython(
  options?: HermesAdapterPythonOptions,
): HermesAdapterPython {
  return new HermesAdapterPython(options);
}

export function isHermesAdapterPython(
  adapter: HermesAdapter,
): adapter is HermesAdapterPython {
  return adapter.adapterId === HERMES_PYTHON_ADAPTER_ID;
}

export function shouldUseHermesPythonAdapter(
  env: EnvSource = process.env,
): boolean {
  if (env.NODE_ENV === "test" && env.HERMES_INTEGRATION_LIVE !== "true") {
    return false;
  }

  if (env.HERMES_USE_PYTHON_AGENT === "true") {
    return (
      Boolean(resolveHermesAgentRoot(env)) &&
      hasGroqCredentialsForHermesAgent(env)
    );
  }

  const mode = readHermesRuntimeEnv(env).mode;
  if (mode === "stub" || mode === "planning" || mode === "cloud") {
    return false;
  }

  if (mode === "official") {
    return env.HERMES_USE_PYTHON_AGENT === "true";
  }

  return (
    (mode === "local" || env.HERMES_USE_PYTHON_AGENT === "true") &&
    Boolean(resolveHermesAgentRoot(env)) &&
    hasGroqCredentialsForHermesAgent(env)
  );
}
