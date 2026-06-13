export interface AssistantReplyCardProps {
  readonly text: string;
}

/**
 * Hermes / assistant natural-language reply below action plan.
 */
export function AssistantReplyCard({ text }: AssistantReplyCardProps) {
  if (!text.trim()) {
    return null;
  }

  return (
    <article
      className="assistant-reply-card"
      aria-label="Assistant reply"
      data-testid="assistant-reply-card"
    >
      <header className="assistant-reply-header">
        <span className="assistant-reply-label">Assistant Reply</span>
      </header>
      <p className="assistant-reply-text">{text}</p>
    </article>
  );
}
