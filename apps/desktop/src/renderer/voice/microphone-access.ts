/**
 * Microphone access helpers for Electron renderer (Windows privacy + getUserMedia).
 */

export const MIC_WINDOWS_PRIVACY_HINT =
  "Microphone access needed. Open Windows Settings → Privacy & security → Microphone, then enable \"Microphone access\" and \"Let desktop apps access your microphone.\"";

export const MIC_DENIED_MESSAGE =
  "Microphone access denied. Check Windows privacy settings and allow desktop apps to use the mic.";

export const MIC_NO_STREAM_MESSAGE = "No audio stream received from the microphone.";

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  sampleRate: 16_000,
};

export function isMicrophoneApiAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export function isValidMediaStream(stream: MediaStream | null | undefined): stream is MediaStream {
  return (
    stream instanceof MediaStream &&
    stream.getAudioTracks().some((track) => track.readyState !== "ended")
  );
}

export function resolveRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }
  return "";
}

/**
 * Request a live microphone stream with desktop-friendly error text.
 */
export async function requestMicrophoneStream(
  signal?: AbortSignal,
): Promise<MediaStream> {
  if (!isMicrophoneApiAvailable()) {
    throw new Error(MIC_WINDOWS_PRIVACY_HINT);
  }

  if (signal?.aborted) {
    throw new DOMException("Microphone capture aborted", "AbortError");
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: AUDIO_CONSTRAINTS,
    });
  } catch (error) {
    console.error("[jarvis] mic access error:", error);
    throw new Error(resolveMicrophoneErrorMessage(error));
  }

  if (signal?.aborted) {
    stream.getTracks().forEach((track) => track.stop());
    throw new DOMException("Microphone capture aborted", "AbortError");
  }

  if (!isValidMediaStream(stream)) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error(MIC_NO_STREAM_MESSAGE);
  }

  return stream;
}

/**
 * Create a MediaRecorder for a validated stream.
 */
export function createMediaRecorderForStream(stream: MediaStream): MediaRecorder {
  if (!isValidMediaStream(stream)) {
    throw new Error(MIC_NO_STREAM_MESSAGE);
  }

  const mimeType = resolveRecorderMimeType();
  try {
    return mimeType.length > 0
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
  } catch (error) {
    console.error("[jarvis] MediaRecorder init failed:", error);
    throw new Error(resolveMicrophoneErrorMessage(error));
  }
}

/** Map DOM / Electron errors to a single user-facing message. */
export function resolveMicrophoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "AbortError") {
      return "Microphone capture cancelled.";
    }
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return MIC_DENIED_MESSAGE;
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No microphone detected. Connect a mic and try again.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "Microphone is in use by another app. Close other apps and try again.";
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("not of type 'mediastream'")) {
    return MIC_NO_STREAM_MESSAGE;
  }
  if (lower.includes("permission") || lower.includes("denied") || lower.includes("not allowed")) {
    return MIC_DENIED_MESSAGE;
  }
  if (lower.includes("notfound") || lower.includes("no device")) {
    return "No microphone detected. Connect a mic and try again.";
  }

  return MIC_DENIED_MESSAGE;
}
