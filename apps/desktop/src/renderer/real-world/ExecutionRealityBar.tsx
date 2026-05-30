import { memo } from "react";

import type { ExecutionRealitySlice } from "./use-execution-reality";

export interface ExecutionRealityBarProps {
  readonly llm: ExecutionRealitySlice;
  readonly browser: ExecutionRealitySlice;
  readonly voice: ExecutionRealitySlice;
  readonly summaryLabel: string;
}

function modeClass(mode: ExecutionRealitySlice["mode"]): string {
  switch (mode) {
    case "REAL MODE":
      return "execution-reality-bar__chip--real";
    case "SIMULATED MODE":
      return "execution-reality-bar__chip--simulated";
    default:
      return "execution-reality-bar__chip--stub";
  }
}

/**
 * Always-visible execution honesty bar — REAL / STUB / SIMULATED (Phase 100A).
 */
export const ExecutionRealityBar = memo(function ExecutionRealityBar({
  llm,
  browser,
  voice,
  summaryLabel,
}: ExecutionRealityBarProps) {
  const chips: readonly ExecutionRealitySlice[] = [llm, browser, voice];

  return (
    <div
      className="execution-reality-bar"
      data-testid="execution-reality-bar"
      aria-label={summaryLabel}
      title={summaryLabel}
    >
      {chips.map((chip, index) => (
        <div
          key={`${chip.mode}-${index}`}
          className={`execution-reality-bar__chip ${modeClass(chip.mode)}`}
          data-testid={`execution-reality-${chip.mode.toLowerCase().replace(/\s+/gu, "-")}`}
        >
          <span className="execution-reality-bar__mode">{chip.mode}</span>
          <span className="execution-reality-bar__detail">{chip.detail}</span>
        </div>
      ))}
    </div>
  );
});
