import { memo } from "react";

export interface WaveformBarsProps {
  readonly levels: readonly number[];
  readonly barCount?: number;
  readonly className?: string;
}

/**
 * Memoized waveform bars — avoids rerendering orb shell (Phase 92).
 */
export const WaveformBars = memo(function WaveformBars({
  levels,
  barCount = 14,
  className = "live-speech-orb__waveform",
}: WaveformBarsProps) {
  const display =
    levels.length >= barCount
      ? levels.slice(-barCount)
      : [...Array(Math.max(0, barCount - levels.length)).fill(0.12), ...levels];

  return (
    <div className={className} aria-hidden data-testid="waveform-bars">
      {display.map((level, index) => (
        <span
          key={`wave-${index}`}
          className="live-speech-orb__bar"
          style={{ transform: `scaleY(${Math.max(0.12, level).toFixed(2)})` }}
        />
      ))}
    </div>
  );
});
