import { useState } from "react";

import type { ApiKeyValidationResult } from "./provider-settings-types";

export interface ApiKeyManagerProps {
  readonly providerId: string;
  readonly configured: boolean;
  readonly disabled?: boolean;
  readonly onSave: (apiKey: string) => Promise<ApiKeyValidationResult>;
  readonly onValidate?: (apiKey: string) => Promise<ApiKeyValidationResult>;
}

function maskConfiguredKey(configured: boolean): string {
  return configured ? "••••••••••••" : "";
}

/** Masked API key input — never displays stored key values (Phase 83). */
export function ApiKeyManager({
  providerId,
  configured,
  disabled = false,
  onSave,
  onValidate,
}: ApiKeyManagerProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) {
      setStatus("Enter an API key");
      return;
    }

    setBusy(true);
    try {
      const result = await onSave(value.trim());
      setStatus(result.message);
      if (result.valid) {
        setValue("");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setBusy(false);
    }
  };

  const handleValidate = async () => {
    if (!onValidate || !value.trim()) {
      return;
    }

    setBusy(true);
    try {
      const result = await onValidate(value.trim());
      setStatus(result.message);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="provider-api-key-manager" data-testid={`api-key-${providerId}`}>
      <label className="provider-api-key-label" htmlFor={`api-key-input-${providerId}`}>
        API key
      </label>
      <input
        id={`api-key-input-${providerId}`}
        className="provider-api-key-input"
        type="password"
        autoComplete="off"
        placeholder={configured ? maskConfiguredKey(true) : "Enter API key"}
        value={value}
        disabled={disabled || busy}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="provider-api-key-actions">
        {onValidate ? (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={disabled || busy || !value.trim()}
            onClick={() => void handleValidate()}
          >
            Test connection
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || busy || !value.trim()}
          onClick={() => void handleSave()}
        >
          Save key
        </button>
      </div>
      {status ? (
        <p className="provider-api-key-status" role="status">
          {status}
        </p>
      ) : null}
      {configured ? (
        <p className="provider-api-key-meta">A key is configured (hidden).</p>
      ) : null}
    </div>
  );
}
