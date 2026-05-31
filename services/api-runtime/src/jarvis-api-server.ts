import http from "node:http";
import { URL } from "node:url";

import type { JarvisApiRequest } from "./jarvis-api-request";
import type { JarvisApiResponse } from "./jarvis-api-response";
import type { JarvisApiRouter } from "./jarvis-api-router";

function readRequestBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }

      const raw = Buffer.concat(chunks).toString("utf-8");
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });

    req.on("error", reject);
  });
}

function writeResponse(
  res: http.ServerResponse,
  response: JarvisApiResponse,
): void {
  res.statusCode = response.status;

  if (response.headers) {
    for (const [key, value] of Object.entries(response.headers)) {
      res.setHeader(key, value);
    }
  }

  if (response.error) {
    if (!response.headers?.["Content-Type"]) {
      res.setHeader("Content-Type", "application/json");
    }
    res.end(JSON.stringify({ error: response.error }));
    return;
  }

  const contentType = response.headers?.["Content-Type"] ?? "";
  if (contentType.includes("text/event-stream")) {
    res.end(typeof response.body === "string" ? response.body : "");
    return;
  }

  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(response.body ?? {}));
}

/**
 * Node HTTP server for Jarvis API runtime (Phase 53).
 */
export class JarvisApiServer {
  private server: http.Server | undefined;
  private boundPort: number | undefined;

  constructor(
    private readonly router: JarvisApiRouter,
    private readonly port = 0,
  ) {}

  getRouter(): JarvisApiRouter {
    return this.router;
  }

  getPort(): number | undefined {
    return this.boundPort;
  }

  getBaseUrl(): string {
    if (this.boundPort === undefined) {
      throw new Error("Server is not started");
    }
    return `http://127.0.0.1:${this.boundPort}`;
  }

  /**
   * Dispatch a request without starting the HTTP server (for tests).
   */
  async handleRequest(request: JarvisApiRequest): Promise<JarvisApiResponse> {
    return this.router.dispatch(request);
  }

  /**
   * Convenience HTTP client against a running server (for integration tests).
   */
  async fetch(
    path: string,
    init: {
      readonly method?: string;
      readonly body?: unknown;
    } = {},
  ): Promise<{ status: number; json: unknown }> {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}${path}`, {
      method: init.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body:
        init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

    const json = (await response.json()) as unknown;
    return { status: response.status, json };
  }

  async start(): Promise<{ port: number; url: string }> {
    if (this.server) {
      return { port: this.boundPort!, url: this.getBaseUrl() };
    }

    this.server = http.createServer((req, res) => {
      void this.handleIncoming(req, res);
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.once("error", reject);
      this.server!.listen(this.port, "127.0.0.1", () => resolve());
    });

    const address = this.server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to resolve server port");
    }

    this.boundPort = address.port;
    return { port: address.port, url: this.getBaseUrl() };
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    const current = this.server;
    this.server = undefined;
    this.boundPort = undefined;

    await new Promise<void>((resolve, reject) => {
      current.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private async handleIncoming(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      const body =
        req.method === "POST" || req.method === "PUT" || req.method === "PATCH"
          ? await readRequestBody(req)
          : undefined;

      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string") {
          headers[key] = value;
        }
      }

      const response = await this.router.dispatch({
        method: req.method ?? "GET",
        path: url.pathname,
        params: {},
        query: Object.fromEntries(url.searchParams.entries()),
        body,
        headers,
      });

      writeResponse(res, response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      writeResponse(res, {
        status: 500,
        error: {
          code: "INTERNAL_ERROR",
          message,
        },
      });
    }
  }
}
