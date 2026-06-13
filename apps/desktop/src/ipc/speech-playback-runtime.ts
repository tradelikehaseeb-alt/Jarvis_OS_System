import { BrowserWindow, type WebContents } from "electron";

import { speechDebug } from "@jarvis/speech-service";

export interface SpeechPlaybackStreamPayload {
  readonly requestId: string;
  readonly audioBase64: string;
  readonly mimeType: string;
  readonly providerId: string;
}

/**
 * Main-process TTS playback runtime — streams synthesized audio to renderers
 * without writing temp files (in-memory IPC push).
 */
export class SpeechPlaybackRuntime {
  private activeRequestId: string | null = null;

  streamPlayback(
    payload: SpeechPlaybackStreamPayload,
    sender?: WebContents,
  ): void {
    this.activeRequestId = payload.requestId;
    speechDebug("TTS Stream Playing", {
      requestId: payload.requestId,
      providerId: payload.providerId,
      bytes: payload.audioBase64.length,
    });

    const targets = new Set<WebContents>();
    if (sender && !sender.isDestroyed()) {
      targets.add(sender);
    }
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) {
        targets.add(window.webContents);
      }
    }

    for (const webContents of targets) {
      if (!webContents.isDestroyed()) {
        webContents.send("speech:playback-stream", payload);
      }
    }
  }

  stopPlayback(): void {
    this.activeRequestId = null;
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) {
        window.webContents.send("speech:playback-stop", {});
      }
    }
  }

  getActiveRequestId(): string | null {
    return this.activeRequestId;
  }
}

let speechPlaybackRuntime: SpeechPlaybackRuntime | undefined;

export function getSpeechPlaybackRuntime(): SpeechPlaybackRuntime {
  if (!speechPlaybackRuntime) {
    speechPlaybackRuntime = new SpeechPlaybackRuntime();
  }
  return speechPlaybackRuntime;
}

export function resetSpeechPlaybackRuntimeForTests(): void {
  speechPlaybackRuntime = undefined;
}
