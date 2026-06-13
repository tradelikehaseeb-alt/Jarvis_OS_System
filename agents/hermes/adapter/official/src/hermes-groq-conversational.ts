import type { HermesRequest } from "../../src/hermes-request";

import type { HermesResponse } from "../../src/hermes-response";

import { buildHermesStructuredPlan, toStructuredPlanJson } from "./hermes-structured-plan";

import {

  hasGroqCredentialsForHermesAgent,

  isHermesAgentRateLimitError,

} from "./hermes-python-process-runner";

import type { EnvSource } from "./hermes-runtime-env";

import {

  buildConversationalSystemPrompt,

  buildGroqMessages,

} from "./hermes-groq-conversational-shared";

import {

  hasGeminiCredentialsForHermes,

  invokeHermesGeminiConversational,

} from "./hermes-gemini-conversational";



const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

const FALLBACK_GROQ_MODEL = "llama-3.1-8b-instant";

const GROQ_RATE_LIMIT_RETRY_DELAY_MS = 15_000;

export const HERMES_GROQ_RATE_LIMIT_MESSAGE =

  "Groq thoda busy hai — 15–20 second wait karo, phir dubara try karo.";



interface GroqChatCompletionResponse {

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



function delay(ms: number): Promise<void> {

  return new Promise((resolve) => setTimeout(resolve, ms));

}



function parseGroqRetryAfterMs(body: string): number {

  const match = /try again in ([\d.]+)s/i.exec(body);

  if (match) {

    return Math.ceil(parseFloat(match[1]!) * 1000) + 800;

  }

  return GROQ_RATE_LIMIT_RETRY_DELAY_MS;

}



function resolveGroqModel(env: EnvSource, override?: string): string {

  return (

    override?.trim() ||

    env.GROQ_MODEL?.trim() ||

    env.JARVIS_GROQ_MODEL?.trim() ||

    DEFAULT_GROQ_MODEL

  );

}



async function callGroqOnce(

  request: HermesRequest,

  options: {

    readonly adapterId: string;

    readonly env: EnvSource;

    readonly fetchFn: typeof fetch;

    readonly model?: string;

  },

): Promise<{ ok: boolean; status: number; body: string; payload?: GroqChatCompletionResponse }> {

  const apiKey =

    options.env.GROQ_API_KEY?.trim() || options.env.JARVIS_GROQ_API_KEY?.trim() || "";



  const response = await options.fetchFn(GROQ_CHAT_COMPLETIONS_URL, {

    method: "POST",

    headers: {

      "Content-Type": "application/json",

      Authorization: `Bearer ${apiKey}`,

    },

    body: JSON.stringify({

      model: resolveGroqModel(options.env, options.model),

      temperature: 0.4,

      max_tokens: 512,

      messages: buildGroqMessages(

        request,

        buildConversationalSystemPrompt(options.env),

        options.env,

      ),

    }),

  });



  const body = await response.text();

  if (!response.ok) {

    return { ok: false, status: response.status, body };

  }



  return {

    ok: true,

    status: response.status,

    body,

    payload: JSON.parse(body) as GroqChatCompletionResponse,

  };

}



function successFromGroqReply(

  request: HermesRequest,

  adapterId: string,

  reply: string,

): HermesResponse {

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

      llmProvider: "groq",

    },

    reasoning: {

      summary: reply,

      confidence: 0.9,

    },

  };

}



async function tryGeminiFallback(

  request: HermesRequest,

  options: {

    readonly adapterId: string;

    readonly env: EnvSource;

    readonly fetchFn: typeof fetch;

  },

): Promise<HermesResponse | undefined> {

  if (!hasGeminiCredentialsForHermes(options.env)) {

    return undefined;

  }

  console.info("[hermes-python] Groq busy — falling back to Gemini");

  const gemini = await invokeHermesGeminiConversational(request, options);

  if (!gemini.success) {

    return undefined;

  }

  return {

    ...gemini,

    plan: {

      ...gemini.plan,

      userStatusMessage: HERMES_GROQ_RATE_LIMIT_MESSAGE,

    },

  };

}



/**

 * Fast Groq chat path for conversational intents — avoids slow `run_agent.py` subprocess.

 */

export async function invokeHermesGroqConversational(

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



  if (!hasGroqCredentialsForHermesAgent(env)) {

    if (hasGeminiCredentialsForHermes(env)) {

      console.info("[hermes-python] Groq missing — Gemini fast path fallback");

      return invokeHermesGeminiConversational(request, { adapterId, env, fetchFn });

    }

    return failure(

      adapterId,

      request,

      "GROQ_API_KEY_MISSING",

      "Set GROQ_API_KEY for Hermes conversational replies",

    );

  }



  try {

    let result = await callGroqOnce(request, { adapterId, env, fetchFn });



    if (

      !result.ok &&

      (result.status === 429 || isHermesAgentRateLimitError(result.body))

    ) {

      console.info("[hermes-python] Groq 429 — trying smaller model", FALLBACK_GROQ_MODEL);

      result = await callGroqOnce(request, {

        adapterId,

        env,

        fetchFn,

        model: FALLBACK_GROQ_MODEL,

      });

    }



    if (

      !result.ok &&

      (result.status === 429 || isHermesAgentRateLimitError(result.body))

    ) {

      const waitMs = parseGroqRetryAfterMs(result.body);

      console.info(`[hermes-python] Groq rate limit — waiting ${waitMs}ms`);

      await delay(waitMs);

      result = await callGroqOnce(request, { adapterId, env, fetchFn });

    }



    if (!result.ok) {

      const gemini = await tryGeminiFallback(request, { adapterId, env, fetchFn });

      if (gemini) {

        return gemini;

      }



      const userMessage =

        result.status === 429 || isHermesAgentRateLimitError(result.body)

          ? HERMES_GROQ_RATE_LIMIT_MESSAGE

          : "Abhi jawab nahi de sakta. Thodi der baad dubara try karo.";

      console.error("[hermes-python] Groq fast path failed:", result.status, result.body.slice(0, 120));

      return failure(adapterId, request, "HERMES_GROQ_HTTP_ERROR", userMessage);

    }



    const reply = result.payload?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!reply) {

      const gemini = await tryGeminiFallback(request, { adapterId, env, fetchFn });

      if (gemini) {

        return gemini;

      }

      return failure(

        adapterId,

        request,

        "HERMES_GROQ_EMPTY_REPLY",

        "Groq returned an empty conversational reply",

      );

    }



    return successFromGroqReply(request, adapterId, reply);

  } catch (error) {

    const message = error instanceof Error ? error.message : "Groq chat failed";

    const gemini = await tryGeminiFallback(request, { adapterId, env, fetchFn });

    if (gemini) {

      return gemini;

    }

    return failure(adapterId, request, "HERMES_GROQ_CHAT_FAILED", message);

  }

}


