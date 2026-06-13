import type { HermesAdapter } from "../../src/hermes-adapter";
import type { HermesConfig } from "../../src/hermes-config";
import type { HermesRequest } from "../../src/hermes-request";
import type { HermesResponse } from "../../src/hermes-response";
import { buildHermesStructuredPlan, toStructuredPlanJson } from "./hermes-structured-plan";
import {
  getHermesExecutionMode,
  getHermesSkillCategory,
  isAutomationConfirmationQuery,
  isConfirmedAutomationExecution,
  resolveHermesToolsets,
  resolveHermesUserStatusMessage,
} from "./get-hermes-execution-mode";
import {
  hasGroqCredentialsForHermesAgent,
  isHermesAgentApiFailureText,
  isHermesAgentNetworkError,
  isHermesAgentRateLimitError,
  resolveHermesAgentRoot,
  runHermesAgentProcess,
} from "./hermes-python-process-runner";
import { invokeHermesGroqConversational } from "./hermes-groq-conversational";
import {
  hasGeminiCredentialsForHermes,
  invokeHermesGeminiConversational,
} from "./hermes-gemini-conversational";
import {
  isHermesSkillsProviderFailure,
  runHermesAgentProcessWithGemini,
} from "./hermes-gemini-skills";
import { readHermesRuntimeEnv, type EnvSource } from "./hermes-runtime-env";

export const HERMES_PYTHON_ADAPTER_ID = "hermes-adapter-python" as const;

export const JARVIS_EXECUTION_TOKEN = "[JARVIS_EXECUTION_TOKEN_ACTIVE]" as const;

const JARVIS_WINDOWS_EXECUTION_DIRECTIVE = [
  JARVIS_EXECUTION_TOKEN,
  "CRITICAL EXECUTION PROTOCOL: The user CONFIRMED a pending Windows automation task.",
  "You are FORBIDDEN from explaining the code, summarizing what you are about to do, or outputting conversational descriptions.",
  "Your response must ONLY and IMMEDIATELY contain the valid JSON tool call format to execute_dynamic_windows_script(python_code=...).",
  "No markdown conversational pre-text or post-text allowed.",
  "Use the Extracted python_code block below — do not re-display it to the user.",
  "After tool execution, return ONLY the real terminal outcome from tool JSON (message/stdout).",
].join(" ");

const PYTHON_FENCE_PATTERN = /```python\s*([\s\S]*?)```/gi;

const CONVERSATIONAL_AUTOMATION_LINE_PATTERN =
  /^(?:main\s+system|yeh\s+raha|python\s+script|shutdown\s+kar|karunga|karun|proceed\??|shall\s+i|kya\s+main|plan:|here\s+is|i\s+will|mai\s+|main\s+|ab\s+main|theek\s+hai|ok\s+so|let\s+me|yeh\s+script|script\s+hai|execute\s+kar|chalaun|chala\s+raha)/i;

const PYTHON_SOURCE_LINE_PATTERN =
  /^\s*(?:import\s+|from\s+\w+\s+import|def\s+|class\s+|if\s+|for\s+|while\s+|try:|with\s+|print\(|subprocess\.|os\.|pathlib\.|pyautogui\.|ctypes\.|shutdown\s*\/|#)/i;

const AUTOMATION_TERMINAL_CONFIRMATION_PATTERN =
  /"success"\s*:\s*true|"exit_code"\s*:\s*0\b|folder\s+(?:successfully\s+)?created|directory\s+created|dynamic\s+windows\s+script\s+completed|process\s+terminated|taskkill\b/i;

const UNEXECUTED_PYTHON_SCRIPT_PATTERN =
  /```python|execute_dynamic_windows_script|import\s+(?:os|subprocess|pyautogui)|def\s+main\s*\(/i;

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

/** Extract Python source blocks from assistant text (fenced or inline). */
export function extractPythonScriptBlocks(text: string): readonly string[] {
  const blocks: string[] = [];
  const source = text.trim();
  if (!source) {
    return blocks;
  }

  for (const match of source.matchAll(PYTHON_FENCE_PATTERN)) {
    const code = match[1]?.trim();
    if (code) {
      blocks.push(code);
    }
  }

  if (blocks.length > 0) {
    return blocks;
  }

  const codeLines = source
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(
      (line) =>
        line.trim().length > 0 && PYTHON_SOURCE_LINE_PATTERN.test(line.trim()),
    );

  if (codeLines.length > 0) {
    blocks.push(codeLines.join("\n").trim());
  }

  return blocks;
}

/** Strip Urdu/English automation filler; keep code fences and source lines. */
export function stripAutomationConversationalFiller(text: string): string {
  const kept: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (/^```/.test(trimmed)) {
      kept.push(line);
      continue;
    }
    if (CONVERSATIONAL_AUTOMATION_LINE_PATTERN.test(trimmed)) {
      continue;
    }
    if (
      PYTHON_SOURCE_LINE_PATTERN.test(trimmed) ||
      /shutdown\s*\/[sr]/i.test(trimmed)
    ) {
      kept.push(line);
    }
  }

  return kept.join("\n").trim();
}

/** Build script-only context for confirmed execution (no conversational prose). */
export function buildExecutionScriptContext(
  turns: NonNullable<HermesRequest["conversationTurns"]>,
): string {
  const scripts: string[] = [];
  let latestUserIntent = "";

  for (const turn of turns.slice(-8)) {
    const message = turn.message.trim();
    if (!message) {
      continue;
    }
    if (turn.role === "assistant") {
      const sanitized = stripAutomationConversationalFiller(message);
      scripts.push(...extractPythonScriptBlocks(sanitized));
      if (scripts.length === 0 && sanitized.length > 0) {
        scripts.push(...extractPythonScriptBlocks(message));
      }
      continue;
    }
    if (
      turn.role === "user" &&
      !isAutomationConfirmationQuery(message) &&
      message.length > 0
    ) {
      latestUserIntent = message;
    }
  }

  const script = scripts.at(-1)?.trim();
  const parts: string[] = [];
  if (latestUserIntent) {
    parts.push(`Original user intent: ${latestUserIntent}`);
  }
  if (script) {
    parts.push(
      "Extracted python_code (execute immediately via execute_dynamic_windows_script tool call only — no conversational text):",
      "```python",
      script,
      "```",
    );
  }
  return parts.join("\n");
}

function buildSkillsQuery(
  request: HermesRequest,
  options?: { readonly executionTokenActive?: boolean },
): string {
  const description = request.intent.description.trim();
  const turns = request.conversationTurns ?? [];

  const contextBlock = options?.executionTokenActive
    ? (() => {
        const scriptContext = buildExecutionScriptContext(turns);
        return scriptContext.length > 0
          ? `\n\n${scriptContext}`
          : turns.length > 0
            ? `\n\nConversation context (script-only):\n${turns
                .slice(-8)
                .map((turn) => {
                  if (turn.role !== "assistant") {
                    return `${turn.role}: ${turn.message}`;
                  }
                  const sanitized = stripAutomationConversationalFiller(
                    turn.message,
                  );
                  const scripts = extractPythonScriptBlocks(sanitized);
                  if (scripts.length > 0) {
                    return `assistant:\n\`\`\`python\n${scripts.at(-1)}\n\`\`\``;
                  }
                  return `assistant: ${sanitized}`;
                })
                .join("\n")}`
            : "";
      })()
    : turns.length > 0
      ? `\n\nConversation context:\n${turns
          .slice(-8)
          .map((turn) => `${turn.role}: ${turn.message}`)
          .join("\n")}`
      : (request.recalledContextSnippets ?? []).length > 0
        ? `\n\nRecalled context:\n${(request.recalledContextSnippets ?? [])
            .slice(0, 8)
            .map((snippet, index) => `${index + 1}. ${snippet}`)
            .join("\n")}`
        : "";

  const executionDirective = options?.executionTokenActive
    ? `\n\n${JARVIS_WINDOWS_EXECUTION_DIRECTIVE}`
    : "";

  return `${description}${contextBlock}${executionDirective}`.trim();
}

function hasAutomationTerminalConfirmation(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || /```python/i.test(trimmed)) {
    return false;
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        success?: boolean;
        exit_code?: number;
      };
      if (
        parsed.success === true &&
        (parsed.exit_code === 0 || parsed.exit_code === undefined)
      ) {
        return true;
      }
    } catch {
      // fall through to marker patterns
    }
  }

  return AUTOMATION_TERMINAL_CONFIRMATION_PATTERN.test(trimmed);
}

function looksLikeUnexecutedPythonScript(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || hasAutomationTerminalConfirmation(trimmed)) {
    return false;
  }
  return UNEXECUTED_PYTHON_SCRIPT_PATTERN.test(trimmed);
}

function stepsFromAgentText(
  request: HermesRequest,
  finalResponse: string,
  executionMode: "fast" | "skills",
): readonly string[] {
  if (executionMode === "fast") {
    const trimmed = finalResponse.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }

  const lines = finalResponse
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[\d\-*.)]+\s*/, "").trim())
    .filter((line) => line.length > 0);

  if (lines.length >= 2) {
    return lines.slice(0, 12);
  }

  const fallback = buildHermesStructuredPlan(request);
  if (finalResponse.length > 0) {
    return [...fallback.steps, finalResponse.slice(0, 400)];
  }

  return fallback.steps;
}

function hasHermesLlmCredentials(env: EnvSource): boolean {
  return (
    hasGroqCredentialsForHermesAgent(env) || hasGeminiCredentialsForHermes(env)
  );
}

function isGroqRateLimitHermesResponse(response: HermesResponse): boolean {
  const message = `${response.error?.message ?? ""}\n${response.error?.code ?? ""}`;
  return isHermesAgentRateLimitError(message);
}

async function invokeFastPathWithGeminiFallback(
  request: HermesRequest,
  options: {
    readonly adapterId: string;
    readonly env: EnvSource;
    readonly skillCategory: ReturnType<typeof getHermesSkillCategory>;
  },
): Promise<HermesResponse> {
  const groqResponse = await invokeHermesGroqConversational(
    {
      ...request,
      conversationTurns: conversationTurnsFromRequest(request),
    },
    {
      adapterId: options.adapterId,
      env: options.env,
    },
  );

  if (
    groqResponse.success ||
    !hasGeminiCredentialsForHermes(options.env) ||
    !isGroqRateLimitHermesResponse(groqResponse)
  ) {
    return {
      ...groqResponse,
      plan: {
        ...groqResponse.plan,
        executionMode: "fast",
        skillCategory: options.skillCategory,
      },
    };
  }

  console.info(
    "[hermes-python] Groq fast path rate-limited — rerouting session to Gemini runtime",
  );
  const geminiResponse = await invokeHermesGeminiConversational(
    {
      ...request,
      conversationTurns: conversationTurnsFromRequest(request),
    },
    {
      adapterId: options.adapterId,
      env: options.env,
    },
  );
  if (!geminiResponse.success) {
    return groqResponse;
  }
  return {
    ...geminiResponse,
    plan: {
      ...geminiResponse.plan,
      executionMode: "fast",
      skillCategory: options.skillCategory,
      llmProvider: "gemini",
    },
  };
}

function sanitizeConversationTurnMessage(message: string): string {
  return message
    .replace(/^Hermes\s+\([^)]+\)\s+\(mock\):\s*/i, "")
    .replace(/^\[(local|cloud|remote)\]\s*/i, "")
    .trim();
}

function conversationTurnsFromRequest(
  request: HermesRequest,
): HermesRequest["conversationTurns"] {
  if (request.conversationTurns && request.conversationTurns.length > 0) {
    return request.conversationTurns
      .map((turn) => ({
        ...turn,
        message: sanitizeConversationTurnMessage(turn.message),
      }))
      .filter((turn) => turn.message.length > 0);
  }
  return (request.recalledContextSnippets ?? []).map((snippet) => {
    const match = /^(user|assistant|system):\s+/i.exec(snippet);
    if (!match) {
      return { role: "user" as const, message: snippet };
    }
    const role = match[1]!.toLowerCase();
    const message = snippet.slice(match[0].length).trim();
    if (role === "assistant" || role === "system") {
      return { role, message };
    }
    return { role: "user" as const, message };
  });
}

/**
 * Real Hermes adapter — Groq fast path or `hermes-agent/run_agent.py` skills subprocess.
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
    const description = request.intent.description.trim();
    const conversationTurns = conversationTurnsFromRequest(request);
    const confirmedAutomationExecution = isConfirmedAutomationExecution(
      description,
      conversationTurns ?? [],
    );
    const executionMode = getHermesExecutionMode(
      description,
      conversationTurns ?? [],
    );
    const skillCategory = getHermesSkillCategory(
      description,
      conversationTurns ?? [],
    );

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

    if (!hasHermesLlmCredentials(this.env)) {
      return failure(
        adapterId,
        request,
        "LLM_CREDENTIALS_MISSING",
        "Set GROQ_API_KEY or GEMINI_API_KEY for Hermes Python agent",
      );
    }

    console.info(
      `[hermes-python] mode=${executionMode} category=${skillCategory} confirmedAutomation=${confirmedAutomationExecution} conversationTurns=${conversationTurns?.length ?? 0}`,
    );

    if (executionMode === "fast") {
      console.info("[hermes-python] conversational fast path (Groq/Gemini, no subprocess)");
      return invokeFastPathWithGeminiFallback(request, {
        adapterId,
        env: this.env,
        skillCategory,
      });
    }

    const statusMessage = resolveHermesUserStatusMessage(skillCategory, description);
    const toolsets = resolveHermesToolsets(skillCategory);
    console.info(
      `[hermes-python] skills path (${skillCategory}, subprocess, toolsets=${toolsets})`,
    );

    const runtime = readHermesRuntimeEnv(this.env);
    const skillsProcessOptions = {
      agentRoot: this.agentRoot,
      query: buildSkillsQuery(request, {
        executionTokenActive: confirmedAutomationExecution,
      }),
      enabledToolsets: toolsets,
      timeoutMs: this.timeoutMs,
      env: this.env as NodeJS.ProcessEnv,
      skillCategory,
      userStatusMessage: statusMessage,
      maxRetries: confirmedAutomationExecution ? 0 : 1,
    };

    let processResult = await runHermesAgentProcess(skillsProcessOptions);

    const hasGeminiRuntime = hasGeminiCredentialsForHermes(this.env);
    const isGroqRateLimitFailure = (result: typeof processResult): boolean =>
      isHermesAgentRateLimitError(result.stderr, result.stdout) ||
      Boolean(
        result.finalResponse && isHermesAgentApiFailureText(result.finalResponse),
      );

    const shouldRetryWithGeminiSkills = (
      result: typeof processResult,
    ): boolean => {
      if (!hasGeminiRuntime) {
        return false;
      }
      if (!result.success || !result.finalResponse) {
        return (
          isGroqRateLimitFailure(result) || isHermesSkillsProviderFailure(result)
        );
      }
      return isGroqRateLimitFailure(result);
    };

    if (shouldRetryWithGeminiSkills(processResult)) {
      console.info(
        "[hermes-python] Groq skills rate-limited — switching to Gemini provider runtime",
      );
      const geminiProcessResult = await runHermesAgentProcessWithGemini(
        skillsProcessOptions,
        this.env,
      );
      if (
        geminiProcessResult?.success &&
        geminiProcessResult.finalResponse &&
        !isHermesAgentApiFailureText(geminiProcessResult.finalResponse)
      ) {
        processResult = geminiProcessResult;
      } else if (geminiProcessResult) {
        processResult = geminiProcessResult;
      }
    }

    const resolvedApiFailureText =
      processResult.finalResponse &&
      isHermesAgentApiFailureText(processResult.finalResponse);

    if (!processResult.success || !processResult.finalResponse || resolvedApiFailureText) {
      const shouldFallback =
        isHermesAgentNetworkError(processResult) ||
        isGroqRateLimitFailure(processResult) ||
        resolvedApiFailureText;

      if (shouldFallback && hasGeminiRuntime && !confirmedAutomationExecution) {
        console.info(
          "[hermes-python] skills subprocess failed — Gemini provider fallback",
        );
        const geminiFallback = await invokeHermesGeminiConversational(
          {
            ...request,
            conversationTurns,
          },
          {
            adapterId,
            env: this.env,
          },
        );
        if (geminiFallback.success) {
          return {
            ...geminiFallback,
            plan: {
              ...geminiFallback.plan,
              executionMode: "fast",
              skillCategory,
              userStatusMessage: statusMessage,
              llmProvider: "gemini",
            },
          };
        }
      }

      if (shouldFallback && !hasGeminiRuntime && !confirmedAutomationExecution) {
        console.info(
          "[hermes-python] skills subprocess failed — Groq fast path fallback",
        );
        const groqFallback = await invokeHermesGroqConversational(
          {
            ...request,
            conversationTurns,
          },
          {
            adapterId,
            env: this.env,
          },
        );
        if (groqFallback.success) {
          return {
            ...groqFallback,
            plan: {
              ...groqFallback.plan,
              executionMode: "fast",
              skillCategory,
              userStatusMessage: statusMessage,
            },
          };
        }
      }

      const detail =
        processResult.errorMessage ??
        "Hermes Python agent did not return a final response";
      const userFacing = processResult.userStatusMessage
        ? `${processResult.userStatusMessage} ${detail}`
        : detail;
      return failure(
        adapterId,
        request,
        processResult.errorCode ?? "HERMES_AGENT_FAILED",
        userFacing,
      );
    }

    const structured = buildHermesStructuredPlan(request);
    const finalResponse = processResult.finalResponse.trim();

    if (
      confirmedAutomationExecution &&
      looksLikeUnexecutedPythonScript(finalResponse)
    ) {
      return failure(
        adapterId,
        request,
        "AUTOMATION_SCRIPT_NOT_EXECUTED",
        "Automation confirmation was received but execute_dynamic_windows_script did not return terminal output. The agent displayed a script instead of executing it.",
      );
    }

    const steps = stepsFromAgentText(request, finalResponse, "skills");
    const planJson = toStructuredPlanJson({
      ...structured,
      goal: structured.goal || description,
      steps,
    });

    return {
      success: true,
      adapterId,
      stub: false,
      plan: {
        ...planJson,
        intentKind: request.intent.kind,
        summary: finalResponse,
        executionMode: "skills",
        skillCategory,
        userStatusMessage: processResult.userStatusMessage ?? statusMessage,
      },
      reasoning: {
        summary: `Hermes Python agent (${runtime.mode}) — ${finalResponse.slice(0, 280)}`,
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
      (hasGroqCredentialsForHermesAgent(env) || hasGeminiCredentialsForHermes(env))
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
    (hasGroqCredentialsForHermesAgent(env) || hasGeminiCredentialsForHermes(env))
  );
}
