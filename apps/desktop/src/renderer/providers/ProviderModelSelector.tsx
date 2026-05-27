export interface ProviderModelSelectorProps {
  readonly providerId: string;
  readonly models: readonly string[];
  readonly selectedModel: string;
  readonly disabled?: boolean;
  readonly onChange: (model: string) => void;
}

/** Model picker for a provider (Phase 83). */
export function ProviderModelSelector({
  providerId,
  models,
  selectedModel,
  disabled = false,
  onChange,
}: ProviderModelSelectorProps) {
  return (
    <label
      className="provider-model-selector"
      data-testid={`model-selector-${providerId}`}
    >
      <span className="provider-model-label">Model</span>
      <select
        className="provider-model-select"
        value={selectedModel}
        disabled={disabled || models.length === 0}
        onChange={(event) => onChange(event.target.value)}
      >
        {models.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </label>
  );
}
