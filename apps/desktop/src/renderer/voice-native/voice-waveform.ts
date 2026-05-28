/**
 * Deterministic waveform bar heights for voice visualization (Phase 90).
 */
export function buildWaveformLevels(
  seed: string,
  barCount = 12,
  amplitude = 1,
): readonly number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const levels: number[] = [];
  for (let i = 0; i < barCount; i += 1) {
    const value = ((hash + i * 17) % 100) / 100;
    levels.push(0.15 + value * 0.85 * amplitude);
  }
  return levels;
}
