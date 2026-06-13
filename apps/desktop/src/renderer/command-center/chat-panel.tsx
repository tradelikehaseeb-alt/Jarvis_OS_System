import { memo } from "react";

import { ChatMessages, type ChatMessage } from "../components/ChatMessages";

export interface ChatPanelProps {
  readonly messages: readonly ChatMessage[];
  /** True while Jarvis is generating or speaking a reply. */
  readonly responding?: boolean;
  /** True while user input is processing (mic, submit, execution). */
  readonly processing?: boolean;
}

/**
 * Command Center chat viewport — Stark HUD scroll surface + reactive motion states.
 */
export const ChatPanel = memo(function ChatPanel({
  messages,
  responding = false,
  processing = false,
}: ChatPanelProps) {
  const panelClass = [
    "chat-panel",
    processing ? "chat-panel--processing" : "",
    responding ? "chat-panel--responding" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={panelClass} data-testid="chat-panel">
      <div className="chat-panel__viewport">
        <ChatMessages messages={messages} responding={responding} />
      </div>
    </div>
  );
});
