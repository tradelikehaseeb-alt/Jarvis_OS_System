import type { HermesRequest } from "../../src/hermes-request";
import type { HermesResponse } from "../../src/hermes-response";
import { buildGroqMessages, buildConversationalSystemPrompt } from "./hermes-groq-conversational-shared";
import { buildHermesStructuredPlan, toStructuredPlanJson } from "./hermes-structured-plan";
import type { EnvSource } from "./hermes-runtime-env";

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_OPENAI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/openai";

interface GeminiChatCompletionResponse {
  readonly choices?: readonly {
    readonly message?: {
      readonly content?: string;
    };
  }[];
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

export function hasGeminiCredentialsForHermes(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return Boolean(
    env.GEMINI_API_KEY?.trim() ||
      env.JARVIS_GEMINI_API_KEY?.trim() ||
      env.GOOGLE_API_KEY?.trim(),
  );
}

function resolveGeminiApiKey(env: EnvSource): string {
  return (
    env.GEMINI_API_KEY?.trim() ||
    env.JARVIS_GEMINI_API_KEY?.trim() ||
    env.GOOGLE_API_KEY?.trim() ||
    ""
  );
}

/**
 * Gemini fallback for fast conversational path when Groq is rate-limited.
 */
export async function invokeHermesGeminiConversational(
  request: HermesRequest,
  options: {
    readonly adapterId: string;
    readonly env?: EnvSource;
    readonly fetchFn?: typeof fetch;
  },
): Promise<HermesResponse> {
  const env = options.env ?? process.env;
  const adapterId = options.adapterId;
  const fetchFn = options.fetchFn ?? fetch;
  const apiKey = resolveGeminiApiKey(env);

  if (!apiKey) {
    return failure(
      adapterId,
      request,
      "GEMINI_API_KEY_MISSING",
      "Set GEMINI_API_KEY for Gemini conversational fallback",
    );
  }

  const model =
    env.GEMINI_MODEL?.trim() ||
    env.JARVIS_GEMINI_MODEL?.trim() ||
    DEFAULT_GEMINI_MODEL;

  try {
    const response = await fetchFn(`${GEMINI_OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: buildGroqMessages(
          request,
          buildConversationalSystemPrompt(env),
          env,
        ),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return failure(
        adapterId,
        request,
        "HERMES_GEMINI_HTTP_ERROR",
        `Gemini chat failed (${response.status}): ${body.slice(0, 240)}`,
      );
    }

    const payload = (await response.json()) as GeminiChatCompletionResponse;
    const reply = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      return failure(
        adapterId,
        request,
        "HERMES_GEMINI_EMPTY_REPLY",
        "Gemini returned an empty conversational reply",
      );
    }

    const structured = buildHermesStructuredPlan(request);
    const planJson = toStructuredPlanJson({
      ...structured,
      goal: structured.goal || request.intent.description.trim(),
      steps: [reply],
    });

    return {
      success: true,
      adapterId,
      stub: false,
      plan: {
        ...planJson,
        intentKind: request.intent.kind,
        summary: reply,
        executionMode: "fast",
        llmProvider: "gemini",
      },
      reasoning: {
        summary: reply,
        confidence: 0.88,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gemini chat failed";
    return failure(adapterId, request, "HERMES_GEMINI_CHAT_FAILED", message);
  }
}
