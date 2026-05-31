/** Silence duration before auto-stop (ms). */
export const VOICE_SILENCE_STOP_MS = 2_000;

export interface VoiceActivityDetectorOptions {
  readonly silenceMs?: number;
  readonly analyser: AnalyserNode;
  readonly onSilence: () => void;
}

/**
 * Simple VAD — stops recording after sustained silence.
 */
export function startVoiceActivityDetector(
  options: VoiceActivityDetectorOptions,
): () => void {
  const silenceMs = options.silenceMs ?? VOICE_SILENCE_STOP_MS;
  const buffer = new Uint8Array(options.analyser.fftSize);
  let silentSince: number | null = null;
  let rafId = 0;

  const tick = (timestamp: number) => {
    options.analyser.getByteTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const deviation = buffer[i]! - 128;
      sum += deviation * deviation;
    }
    const rms = Math.sqrt(sum / buffer.length);
    const speaking = rms > 6;

    if (speaking) {
      silentSince = null;
    } else if (silentSince === null) {
      silentSince = timestamp;
    } else if (timestamp - silentSince >= silenceMs) {
      options.onSilence();
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}
