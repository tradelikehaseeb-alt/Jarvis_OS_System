import type { SpeechToTextAdapter } from "./speech-to-text-adapter";
import type { TextToSpeechAdapter } from "./text-to-speech-adapter";

/**
 * In-memory adapter registry for speech provider abstraction (Phase 28).
 */
export class SpeechAdapterRegistry {
  private readonly sttById = new Map<string, SpeechToTextAdapter>();
  private readonly ttsById = new Map<string, TextToSpeechAdapter>();

  registerSpeechToText(adapter: SpeechToTextAdapter): void {
    this.sttById.set(adapter.adapterId, adapter);
  }

  registerTextToSpeech(adapter: TextToSpeechAdapter): void {
    this.ttsById.set(adapter.adapterId, adapter);
  }

  resolveSpeechToText(adapterId: string): SpeechToTextAdapter {
    const adapter = this.sttById.get(adapterId);
    if (!adapter) {
      throw new Error(`SpeechToTextAdapter not found: ${adapterId}`);
    }
    return adapter;
  }

  resolveTextToSpeech(adapterId: string): TextToSpeechAdapter {
    const adapter = this.ttsById.get(adapterId);
    if (!adapter) {
      throw new Error(`TextToSpeechAdapter not found: ${adapterId}`);
    }
    return adapter;
  }

  listSpeechToTextAdapterIds(): readonly string[] {
    return [...this.sttById.keys()].sort((a, b) => a.localeCompare(b));
  }

  listTextToSpeechAdapterIds(): readonly string[] {
    return [...this.ttsById.keys()].sort((a, b) => a.localeCompare(b));
  }
}
