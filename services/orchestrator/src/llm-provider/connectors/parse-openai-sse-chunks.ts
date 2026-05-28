interface OpenAiSseDelta {
  readonly choices?: readonly {
    readonly delta?: { readonly content?: string };
  }[];
}

/**
 * Incrementally parse OpenAI-compatible SSE lines into content deltas (Phase 89).
 */
export function parseOpenAiSseLine(line: string): string | undefined {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) {
    return undefined;
  }

  const payload = trimmed.slice(5).trim();
  if (payload.length === 0 || payload === "[DONE]") {
    return undefined;
  }

  try {
    const parsed = JSON.parse(payload) as OpenAiSseDelta;
    const delta = parsed.choices?.[0]?.delta?.content;
    return typeof delta === "string" && delta.length > 0 ? delta : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Consume a ReadableStream of SSE bytes and invoke onChunk for each delta.
 */
export async function consumeOpenAiSseStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const delta = parseOpenAiSseLine(line);
      if (delta) {
        content += delta;
        onChunk(delta);
      }
    }
  }

  const trailing = parseOpenAiSseLine(buffer);
  if (trailing) {
    content += trailing;
    onChunk(trailing);
  }

  return content;
}
