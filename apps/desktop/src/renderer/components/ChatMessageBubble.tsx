import { friendlyUserErrorMessage, sanitizeAssistantReplyForDisplay } from "@jarvis/types";

import type { ChatMessage } from "./ChatMessages";
import { AssistantReplyCard } from "./AssistantReplyCard";
import { HermesPlanMessage } from "./HermesPlanMessage";
import { JarvisVoiceWave } from "./JarvisVoiceWave";

function errorHintForMessage(text: string): string | undefined {
  if (text.includes("429") || text.toLowerCase().includes("rate limit")) {
    return "Groq free tier limit — 15–20s wait karo ya GEMINI_API_KEY fallback use karo.";
  }
  if (
    text.toLowerCase().includes("mediastream") ||
    text.toLowerCase().includes("microphone")
  ) {
    return "Windows Settings → Privacy → Microphone — enable access for desktop apps, then restart Jarvis.";
  }
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
  readonly showVoiceWave?: boolean;
}

/**
 * Single chat bubble — text, loading, error, or Hermes plan card (Phase 23).
 */
function formatMessageClock(): string {
  return new Date().toISOString().slice(11, 19);
}

export function ChatMessageBubble({
  message,
  showVoiceWave = false,
}: ChatMessageBubbleProps) {
  const clockLabel = message.createdAt ?? formatMessageClock();
  const className = `chat-bubble chat-bubble--os cc-hud-frame ${message.role}${
    showVoiceWave ? " chat-bubble--responding chat-bubble--streaming" : ""
  }`;

  if (message.role === "loading") {
    return (
      <div className={className} role="status" aria-busy="true">
        <span className="chat-bubble__meta">
          <span className="chat-bubble__role">SYS</span>
          <time className="chat-bubble__time">{clockLabel}</time>
        </span>
        <JarvisVoiceWave />
        <span className="spinner" aria-hidden />
        {message.text}
      </div>
    );
  }

  if (message.role === "error") {
    const displayError = friendlyUserErrorMessage(message.text);
    const hint = errorHintForMessage(message.text);
    return (
      <div className={className} role="alert" data-testid="chat-error">
        <span className="chat-bubble__meta">
          <span className="chat-bubble__role">ALERT</span>
          <time className="chat-bubble__time">{clockLabel}</time>
        </span>
        <p className="chat-error-text">{displayError}</p>
        {hint ? <p className="chat-error-hint">{hint}</p> : null}
      </div>
    );
  }

  if (message.role === "assistant" && message.hermesPlan) {
    const reply = message.assistantReply ?? message.text;
    return (
      <div className={`${className} has-plan`}>
        <span className="chat-bubble__meta">
          <span className="chat-bubble__role">JARVIS</span>
          <time className="chat-bubble__time">{clockLabel}</time>
        </span>
        <HermesPlanMessage data={message.hermesPlan} />
        <AssistantReplyCard text={reply} />
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className={className}>
        <span className="chat-bubble__meta">
          <span className="chat-bubble__role">YOU</span>
          <time className="chat-bubble__time">{clockLabel}</time>
        </span>
        <p className="chat-user-text">{message.text}</p>
      </div>
    );
  }

  const replyText = sanitizeAssistantReplyForDisplay(
    message.assistantReply ?? message.text,
  );
  return (
    <div className={`${className} assistant-reply-bubble jarvis-reply`}>
      <span className="chat-bubble__meta">
        <span className="chat-bubble__role">JARVIS</span>
        <time className="chat-bubble__time">{clockLabel}</time>
      </span>
      {showVoiceWave ? <JarvisVoiceWave testId="jarvis-reply-voice-wave" /> : null}
      <p className="chat-assistant-text">{replyText}</p>
    </div>
  );
}