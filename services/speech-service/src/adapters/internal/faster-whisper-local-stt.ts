import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runPythonCommand } from "./run-python-command";

export interface LocalWhisperTranscription {
  readonly text: string;
  readonly confidence: number;
}

const FASTER_WHISPER_SCRIPT = `
import json, sys
from faster_whisper import WhisperModel
path = sys.argv[1]
model = WhisperModel("small", device="cpu", compute_type="int8")
segments, info = model.transcribe(path, vad_filter=True)
text = " ".join(segment.text.strip() for segment in segments).strip()
if not text:
    print(json.dumps({"error": "NO_SPEECH_DETECTED"}))
else:
    print(json.dumps({"text": text, "language": info.language}))
`.trim();

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("wav")) {
    return ".wav";
  }
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) {
    return ".mp3";
  }
  return ".webm";
}

/**
 * Offline STT via faster-whisper (Python small model).
 */
export async function transcribeWithFasterWhisperLocal(options: {
  readonly audio: Buffer;
  readonly mimeType?: string;
  readonly pythonCommand: string;
}): Promise<LocalWhisperTranscription> {
  const dir = await mkdtemp(join(tmpdir(), "jarvis-stt-"));
  const ext = extensionForMime(options.mimeType ?? "audio/webm");
  const audioPath = join(dir, `audio${ext}`);
  const scriptPath = join(dir, "transcribe.py");

  try {
    await writeFile(audioPath, options.audio);
    await writeFile(scriptPath, FASTER_WHISPER_SCRIPT, "utf8");

    const result = await runPythonCommand(
      options.pythonCommand,
      [scriptPath, audioPath],
      60_000,
    );

    if (result.exitCode !== 0) {
      throw new Error(
        result.stderr || `faster-whisper exited with code ${result.exitCode}`,
      );
    }

    const payload = JSON.parse(result.stdout) as {
      text?: string;
      error?: string;
    };
    if (payload.error === "NO_SPEECH_DETECTED") {
      throw new Error("NO_SPEECH_DETECTED");
    }
    const text = payload.text?.trim() ?? "";
    if (text.length === 0) {
      throw new Error("NO_SPEECH_DETECTED");
    }
    return { text, confidence: 0.82 };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
