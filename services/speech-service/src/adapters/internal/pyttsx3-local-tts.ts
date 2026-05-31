import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runPythonCommand } from "./run-python-command";

const PYTTSX3_SCRIPT = `
import json, sys
import pyttsx3
text = sys.argv[1]
out = sys.argv[2]
engine = pyttsx3.init()
engine.save_to_file(text, out)
engine.runAndWait()
print(json.dumps({"ok": True}))
`.trim();

/**
 * Offline TTS via pyttsx3 (WAV output).
 */
export async function synthesizeWithPyttsx3(options: {
  readonly text: string;
  readonly pythonCommand: string;
}): Promise<{ readonly audio: Buffer; readonly mimeType: string }> {
  const dir = await mkdtemp(join(tmpdir(), "jarvis-tts-"));
  const outputPath = join(dir, "speech.wav");
  const scriptPath = join(dir, "speak.py");

  try {
    await writeFile(scriptPath, PYTTSX3_SCRIPT, "utf8");
    const result = await runPythonCommand(
      options.pythonCommand,
      [scriptPath, options.text, outputPath],
      45_000,
    );
    if (result.exitCode !== 0) {
      throw new Error(result.stderr || `pyttsx3 exited with code ${result.exitCode}`);
    }
    const audio = await readFile(outputPath);
    if (audio.length === 0) {
      throw new Error("pyttsx3 returned empty audio");
    }
    return { audio, mimeType: "audio/wav" };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
