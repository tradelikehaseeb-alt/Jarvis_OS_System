import type { UserTask } from "@jarvis/types";

import {
  createDefaultProviderSettingsRuntime,
  type ProviderSettingsRuntime,
} from "../llm-provider/connectors/create-default-provider-settings-runtime";
import { createDefaultProviderValidationRuntime } from "../llm-provider/connectors/provider-validation-runtime";
import type { LlmProviderResponse } from "../llm-provider/llm-provider-response";
import type { LlmProviderKind, LlmProviderValidation } from "../llm-provider/llm-provider";
import { shouldUseOrchestratorLlmPlanning } from "./should-use-orchestrator-llm-planning";

export type TaskLlmPlanningSource = "orchestrator-llm" | "hermes-adapter" | "skipped";

export interface InvokeTaskLlmInput {
  readonly task: UserTask;
  readonly requestId: string;
  readonly providerSettingsRuntime?: ProviderSettingsRuntime;
}

export interface InvokeTaskLlmResult {
  readonly planningSource: TaskLlmPlanningSource;
  readonly response?: LlmProviderResponse;
  readonly validation?: LlmProviderValidation;
}

function conversationalLlmEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return env.JARVIS_ENABLE_CONVERSATIONAL_LLM !== "false";
}

function buildLlmPrompt(task: UserTask, useOrchestratorPlanning: boolean): string {
  if (useOrchestratorPlanning) {
    return [
      "You are Jarvis OS planning layer.",
      `Intent: ${task.intent.kind}`,
      `Task: ${task.intent.description}`,
      "Return a concise numbered plan the execution agents can follow.",
    ].join("\n");
  }

  return [
    "You are Jarvis, a helpful AI operating system assistant.",
    "Reply in 1-3 sentences, clear and actionable.",
    `User intent: ${task.intent.kind}`,
    `User message: ${task.intent.description}`,
  ].join("\n");
}

/**
 * Phase 1 — invoke configured LLM for conversational reply (Groq/OpenAI/etc.).
 * Orchestrator planning prompts only when {@link shouldUseOrchestratorLlmPlanning} is true.
 */
export async function invokeTaskLlm(
  input: InvokeTaskLlmInput,
): Promise<InvokeTaskLlmResult> {
  const useOrchestratorPlanning = shouldUseOrchestratorLlmPlanning();
  if (!useOrchestratorPlanning && !conversationalLlmEnabled()) {
    return { planningSource: "hermes-adapter" };
  }

  const runtime =
    input.providerSettingsRuntime ?? createDefaultProviderSettingsRuntime();
  const providerId = runtime.resolveProviderId(
    input.task.userId,
    input.task.metadata,
  );

  const apiValidation = await runtime.validateApiKey(input.task.userId, providerId);
  const configuration =
    createDefaultProviderValidationRuntime().getConfiguration(providerId);
  const validation: LlmProviderValidation = {
    valid: apiValidation.valid,
    providerId: apiValidation.providerId,
    stub: apiValidation.stub,
    message: apiValidation.message,
    kind: configuration?.kind ?? ("stub" satisfies LlmProviderKind),
  };

  const response = await runtime.executePrompt({
    prompt: buildLlmPrompt(input.task, useOrchestratorPlanning),
    taskId: input.task.id,
    userId: input.task.userId,
    providerId,
    metadata: {
      ...input.task.metadata,
      requestId: input.requestId,
    },
  });

  return {
    planningSource: useOrchestratorPlanning ? "orchestrator-llm" : "hermes-adapter",
    response,
    validation,
  };
}
