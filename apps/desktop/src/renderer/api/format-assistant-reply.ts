import type { TaskStatusResponse } from "@jarvis/types";

function readLlmAssistantText(status: TaskStatusResponse): string | undefined {
  const output = status.output;
  if (!output) {
    return undefined;
  }

  const assistantReply = output.assistantReply;
  if (typeof assistantReply === "string" && assistantReply.trim().length > 0) {
    return assistantReply.trim();
  }

  const llmProvider = output.llmProvider as
    | { contentPreview?: string; success?: boolean }
    | undefined;
  if (
    llmProvider?.success !== false &&
    typeof llmProvider?.contentPreview === "string" &&
    llmProvider.contentPreview.trim().length > 0
  ) {
    return llmProvider.contentPreview.trim();
  }

  return undefined;
}

/** User-visible chat reply from task output (LLM, search skill, or status). */
export function formatAssistantReply(status: TaskStatusResponse): string {
  const llmText = readLlmAssistantText(status);
  if (llmText) {
    return llmText;
  }

  const skill = status.output?.skill as
    | { skillId?: string; data?: { results?: { title: string }[] } }
    | undefined;

  if (skill?.skillId === "search-skill" && skill.data?.results?.length) {
    const titles = skill.data.results.map((r) => r.title).join(", ");
    return `Done. Results: ${titles}`;
  }

  if (status.output?.routing) {
    const agent = (status.output.routing as { selectedAgentId?: string })
      .selectedAgentId;
    return status.status === "completed"
      ? agent
        ? `Complete. Routed to ${agent}.`
        : "Complete."
      : `Status: ${status.status}.`;
  }

  return status.status === "completed" ? "Complete." : `Status: ${status.status}.`;
}
