import type { KeyboardEvent, ReactNode } from "react";

export interface ChatInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  /** Optional leading control (e.g. mock voice mic — Phase 25). */
  readonly leadingAction?: ReactNode;
}

/**
 * Chat message composer (Phase 18–25).
 */
export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false,
  leadingAction,
}: ChatInputProps) {  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="chat-input-row">
      {leadingAction}
      <input        className="chat-input"
        type="text"
        placeholder="Ask Jarvis…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        aria-label="Chat message"
      />
      <button
        type="button"
        className="btn"
        onClick={onSubmit}
        disabled={disabled || loading || !value.trim()}
      >
        {loading ? "Sending…" : "Send"}
      </button>
    </div>
  );
}
