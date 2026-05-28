import type { TaskIntent } from "@jarvis/types";

export type WorkflowStepKind = "browser" | "desktop" | "task";

export interface WorkflowStep {
  readonly id: string;
  readonly kind: WorkflowStepKind;
  readonly action: string;
  readonly url?: string;
  readonly selector?: string;
  readonly text?: string;
  readonly target?: string;
}

export interface WorkflowDefinition {
  readonly workflowId: string;
  readonly intentKind: TaskIntent["kind"];
  readonly description: string;
  readonly steps: readonly WorkflowStep[];
  readonly stub: boolean;
}

export interface WorkflowExecutionProgress {
  readonly stepId: string;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly message: string;
  readonly completed: boolean;
}

export interface WorkflowExecutionResult {
  readonly workflowId: string;
  readonly success: boolean;
  readonly stub: boolean;
  readonly stepsCompleted: number;
  readonly progress: readonly WorkflowExecutionProgress[];
  readonly message: string;
}

const GMAIL_PATTERN = /\bgmail\b/i;
const SUMMARIZE_PATTERN = /\b(summarize|summary|unread)\b/i;

function buildGmailWorkflow(description: string, stub: boolean): WorkflowDefinition {
  const steps: WorkflowStep[] = [
    {
      id: "step-open-gmail",
      kind: "browser",
      action: "open-page",
      url: "https://mail.google.com",
    },
  ];

  if (SUMMARIZE_PATTERN.test(description)) {
    steps.push({
      id: "step-extract-inbox",
      kind: "browser",
      action: "extract-content",
      url: "https://mail.google.com",
      selector: "body",
    });
    steps.push({
      id: "step-summarize",
      kind: "task",
      action: "summarize",
      text: "Summarize unread emails from extracted content",
    });
  }

  return {
    workflowId: `wf-gmail-${Date.now()}`,
    intentKind: "automate",
    description,
    steps,
    stub,
  };
}

function buildGenericAutomateWorkflow(
  description: string,
  stub: boolean,
): WorkflowDefinition {
  const steps: WorkflowStep[] = [
    {
      id: "step-browser-open",
      kind: "browser",
      action: "open-page",
      url: "https://stub.local/task",
    },
    {
      id: "step-browser-extract",
      kind: "browser",
      action: "extract-content",
      selector: "body",
    },
  ];

  return {
    workflowId: `wf-auto-${Date.now()}`,
    intentKind: "automate",
    description,
    steps,
    stub,
  };
}

/**
 * Builds multi-step browser/desktop workflows from user intent (Phase 95).
 */
export class WorkflowExecutionEngine {
  buildWorkflowFromIntent(intent: TaskIntent, stub = true): WorkflowDefinition | undefined {
    if (intent.kind !== "automate") {
      return undefined;
    }

    if (GMAIL_PATTERN.test(intent.description)) {
      return buildGmailWorkflow(intent.description, stub);
    }

    return buildGenericAutomateWorkflow(intent.description, stub);
  }

  summarizeProgress(
    workflow: WorkflowDefinition,
    completedSteps: number,
  ): WorkflowExecutionProgress[] {
    return workflow.steps.map((step, index) => ({
      stepId: step.id,
      stepIndex: index,
      totalSteps: workflow.steps.length,
      message:
        index < completedSteps
          ? `Completed ${step.action}`
          : index === completedSteps
            ? `Running ${step.action}`
            : `Pending ${step.action}`,
      completed: index < completedSteps,
    }));
  }
}

export function createDefaultWorkflowExecutionEngine(): WorkflowExecutionEngine {
  return new WorkflowExecutionEngine();
}
