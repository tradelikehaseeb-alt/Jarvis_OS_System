import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const execFileAsync = promisify(execFile);

async function streamToBuffer(stream: AsyncIterable<Uint8Array | Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function synthesizeWithEdgeTtsCli(options: {
  readonly text: string;
  readonly voice: string;
  readonly rate: string;
  readonly volume: string;
}): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "jarvis-tts-"));
  const outputPath = join(dir, "speech.mp3");
  try {
    await execFileAsync(
      "edge-tts",
      [
        "--voice",
        options.voice,
        "--rate",
        options.rate,
        "--volume",
        options.volume,
        "--text",
        options.text,
        "--write-media",
        outputPath,
      ],
      { timeout: 20_000, windowsHide: true },
    );
    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function synthesizeWithMsEdgeTts(
  text: string,
  voice: string,
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  try {
    return await streamToBuffer(audioStream);
  } finally {
    tts.close();
  }
}

/**
 * Edge TTS synthesis — CLI first, msedge-tts library fallback.
 */
export async function synthesizeWithEdgeTts(options: {
  readonly text: string;
  readonly voice: string;
  readonly rate?: string;
  readonly volume?: string;
}): Promise<Buffer> {
  const rate = options.rate ?? "+0%";
  const volume = options.volume ?? "+0%";

  try {
    const cliAudio = await synthesizeWithEdgeTtsCli({
      text: options.text,
      voice: options.voice,
      rate,
      volume,
    });
    if (cliAudio.length > 0) {
      return cliAudio;
    }
  } catch {
    // fall through to msedge-tts
  }

  const libraryAudio = await synthesizeWithMsEdgeTts(options.text, options.voice);
  if (libraryAudio.length === 0) {
    throw new Error("Edge TTS returned empty audio");
  }
  return libraryAudio;
}
