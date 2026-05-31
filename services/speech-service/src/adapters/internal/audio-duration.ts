const MIN_SPEECH_DURATION_SEC = 0.5;

/**
 * Estimates audio duration from buffer headers or byte size heuristics.
 */
export function estimateAudioDurationSeconds(
  audio: Buffer,
  mimeType?: string,
): number | null {
  if (audio.length < 16) {
    return 0;
  }

  const mime = (mimeType ?? "").toLowerCase();
  if (mime.includes("wav") || audio.slice(0, 4).toString("ascii") === "RIFF") {
    return parseWavDurationSeconds(audio);
  }

  // WebM/MP3/Opus: ~32 kbps heuristic for voice clips
  const assumedBitrateBps = mime.includes("mp3") ? 128_000 : 32_000;
  return (audio.length * 8) / assumedBitrateBps;
}

function parseWavDurationSeconds(buffer: Buffer): number | null {
  if (buffer.length < 44 || buffer.slice(0, 4).toString("ascii") !== "RIFF") {
    return null;
  }
  const channels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const bitsPerSample = buffer.readUInt16LE(34);
  if (sampleRate <= 0 || channels <= 0 || bitsPerSample <= 0) {
    return null;
  }
  const dataBytes = buffer.length - 44;
  const bytesPerSecond = (sampleRate * channels * bitsPerSample) / 8;
  return dataBytes / bytesPerSecond;
}

export function isAudioTooShort(
  audio: Buffer,
  mimeType?: string,
): boolean {
  const duration = estimateAudioDurationSeconds(audio, mimeType);
  if (duration === null) {
    return audio.length < 2_000;
  }
  return duration < MIN_SPEECH_DURATION_SEC;
}
