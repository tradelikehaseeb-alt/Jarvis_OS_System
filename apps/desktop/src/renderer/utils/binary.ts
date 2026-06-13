/** Convert recorded audio blob to base64 for main-process STT IPC. */
export async function blobToAudioBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const slice = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export function playAudioBase64(audioBase64: string, mimeType = "audio/mpeg"): HTMLAudioElement {
  const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
  void audio.play();
  return audio;
}
