import type { ChatMessage } from "./ChatMessages";
import { IntentBadge } from "./IntentBadge";
import { HermesPlanMessage } from "./HermesPlanMessage";
export interface ChatMessageBubbleProps {
  readonly message: ChatMessage;
}

/**
 * Single chat bubble — text, loading, error, or Hermes plan card (Phase 23).
 */
export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const className = `chat-bubble ${message.role}`;

  if (message.role === "loading") {
    return (
      <div className={className} role="status" aria-busy="true">
        <span className="spinner" aria-hidden />
        {message.text}
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className={className} role="alert" data-testid="chat-error">
        <strong className="chat-error-label">Error</strong>
        <p>{message.text}</p>
      </div>
    );
  }

  if (message.role === "assistant" && message.hermesPlan) {
    return (
      <div className={`${className} has-plan`}>
        {message.text ? <p className="chat-assistant-lead">{message.text}</p> : null}
        <HermesPlanMessage data={message.hermesPlan} />
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className={className}>
        {message.detectedIntent ? (
          <div className="chat-user-meta">
            <IntentBadge intent={message.detectedIntent} />
          </div>
        ) : null}
        <p className="chat-user-text">{message.text}</p>
      </div>
    );
  }

  return <div className={className}>{message.text}</div>;
}