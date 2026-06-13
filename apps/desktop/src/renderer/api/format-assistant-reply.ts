import {
  friendlyUserErrorMessage,
  resolveAssistantReplyFromTaskStatus,
  sanitizeAssistantReplyForDisplay,
  type TaskStatusResponse,
} from "@jarvis/types";

function isInternalMemoryDigest(text: string): boolean {
  return /^Memory summary for user /i.test(text.trim());
}

/** User-visible chat reply from task output (LLM, search skill, or status). */
export function formatAssistantReply(status: TaskStatusResponse): string {
  const resolved = resolveAssistantReplyFromTaskStatus(status);
  if (resolved && !isInternalMemoryDigest(resolved)) {
    return sanitizeAssistantReplyForDisplay(resolved);
  }

  if (status.status === "failed") {
    return friendlyUserErrorMessage(status.error?.message);
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
