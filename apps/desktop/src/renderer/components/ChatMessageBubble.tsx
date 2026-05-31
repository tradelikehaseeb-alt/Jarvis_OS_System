import type { ChatMessage } from "./ChatMessages";
import { IntentBadge } from "./IntentBadge";
import { HermesPlanMessage } from "./HermesPlanMessage";

function errorHintForMessage(text: string): string | undefined {
  if (text.includes("network_disabled") || text.includes("OpenClaw endpoint not reachable")) {
    return "Start OpenClaw in WSL: .\\scripts\\start-openclaw-gateway-wsl.ps1 — then restart Jarvis.";
  }
  if (text.includes("Hermes endpoint not reachable")) {
    return "Use HERMES_MODE=planning in .env until Nous plan API is running on :8080.";
  }
  return undefined;
}

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
    const hint = errorHintForMessage(message.text);
    return (
      <div className={className} role="alert" data-testid="chat-error">
        <strong className="chat-error-label">Could not complete</strong>
        <p className="chat-error-text">{message.text}</p>
        {hint ? <p className="chat-error-hint">{hint}</p> : null}
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