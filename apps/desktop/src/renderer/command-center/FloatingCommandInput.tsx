import type { ReactNode } from "react";

export interface FloatingCommandInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly loading?: boolean;
  readonly placeholder?: string;
  readonly leadingAction?: ReactNode;
}

/**
 * Floating command composer for the Jarvis command center (Phase 89).
 */
export function FloatingCommandInput({
  value,
  onChange,
  onSubmit,
  loading = false,
  placeholder = "Ask Jarvis anything…",
  leadingAction,
}: FloatingCommandInputProps) {
  return (
    <div className="floating-command-input" data-testid="floating-command-input">
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
            onSubmit();
          }
        }}
        placeholder={placeholder}
        disabled={loading}
        aria-label="Command input"
      />
      <button
        type="button"
        className="floating-command-input__send btn"
        onClick={onSubmit}
        disabled={loading || value.trim().length === 0}
        aria-label="Send"
      >
        {loading ? "…" : "Send"}
      </button>
    </div>
  );
}
