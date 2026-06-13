import type { ReactNode } from "react";

export interface FloatingCommandInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly loading?: boolean;
  readonly onCancel?: () => void;
  readonly placeholder?: string;
  readonly leadingAction?: ReactNode;
  /** Terminal marquee status shown above the command bar */
  readonly statusMarquee?: string;
  readonly className?: string;
}

/**
 * Floating command composer for the Jarvis command center (Phase 89).
 */
export function FloatingCommandInput({
  value,
  onChange,
  onSubmit,
  loading = false,
  onCancel,
  placeholder = "Ask Jarvis anything…",
  leadingAction,
  statusMarquee,
  className = "",
}: FloatingCommandInputProps) {
  return (
    <div className="cc-command-dock" data-testid="floating-command-input">
      {statusMarquee ? (
        <div
          className="cc-command-marquee"
          role="status"
          aria-live="polite"
          data-testid="command-status-marquee"
        >
          <span className="cc-command-marquee__prefix">&gt;</span>
          <span className="cc-command-marquee__track">{statusMarquee}</span>
        </div>
      ) : null}
      <div className={`floating-command-input cc-command-bar cc-glass cc-hud-frame ${className}`.trim()}>
      {leadingAction ? (
        <div className="floating-command-input__leading">{leadingAction}</div>
      ) : null}
      <input
        type="text"
        className="floating-command-input__field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (value.trim().length > 0) {
              onSubmit();
            }
          }
        }}
        placeholder={loading ? "Type next question while Jarvis thinks…" : placeholder}
        aria-busy={loading || undefined}
        aria-label="Command input"
      />
      {loading && onCancel ? (
        <button
          type="button"
          className="floating-command-input__cancel btn btn--ghost"
          onClick={onCancel}
          aria-label="Dismiss thinking state"
        >
          Dismiss
        </button>
      ) : null}
      <button
        type="button"
        className="floating-command-input__send btn"
        onClick={onSubmit}
        disabled={value.trim().length === 0}
        aria-label="Send"
      >
        {loading ? "Send" : "Send"}
      </button>
      </div>
    </div>
  );
}
