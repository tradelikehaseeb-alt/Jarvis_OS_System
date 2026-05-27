import type { ApiHealth } from "@jarvis/api-runtime";
import {
  createDefaultJarvisApiServer,
  type JarvisApiServer,
} from "@jarvis/api-runtime";

/** Default embedded Jarvis API runtime port (Phase 54). */
export const DEFAULT_EMBEDDED_API_PORT = 8787;

let embeddedServer: JarvisApiServer | undefined;
let embeddedBaseUrl: string | undefined;

function useEmbeddedRuntime(): boolean {
  if (process.env.JARVIS_USE_EMBEDDED_API_RUNTIME === "false") {
    return false;
  }
  return !process.env.JARVIS_API_URL;
}

/**
 * Start embedded {@link JarvisApiServer} when no external API URL is configured.
 */
export async function startEmbeddedApiRuntime(): Promise<string> {
  if (process.env.JARVIS_API_URL) {
    embeddedBaseUrl = process.env.JARVIS_API_URL;
    return embeddedBaseUrl;
  }

  if (embeddedBaseUrl) {
    return embeddedBaseUrl;
  }

  if (!useEmbeddedRuntime()) {
    embeddedBaseUrl = process.env.JARVIS_API_URL ?? "http://127.0.0.1:8000";
    return embeddedBaseUrl;
  }

  const port = Number(process.env.JARVIS_API_RUNTIME_PORT ?? DEFAULT_EMBEDDED_API_PORT);
  embeddedServer = await createDefaultJarvisApiServer({ port });
  const started = await embeddedServer.start();
  embeddedBaseUrl = started.url;
  return embeddedBaseUrl;
}

export function getEmbeddedApiBaseUrl(): string | undefined {
  return embeddedBaseUrl;
}

export async function stopEmbeddedApiRuntime(): Promise<void> {
  await embeddedServer?.stop();
  embeddedServer = undefined;
  embeddedBaseUrl = undefined;
}

export async function getEmbeddedApiHealth(): Promise<ApiHealth | null> {
  if (!embeddedServer) {
    return null;
  }

  const response = await embeddedServer.handleRequest({
    method: "GET",
    path: "/health",
    params: {},
    query: {},
    body: undefined,
    headers: {},
  });

  return (response.body ?? null) as ApiHealth | null;
}
