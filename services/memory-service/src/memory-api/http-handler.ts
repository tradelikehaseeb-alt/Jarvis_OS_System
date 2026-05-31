import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";

import type { MemoryCategory } from "../storage-adapter/sqlite-schema";
import type { DefaultMemoryApiService } from "./default-memory-api-service";

function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw.length > 0 ? (JSON.parse(raw) as T) : ({} as T));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

const DEFAULT_USER = "default";

/**
 * Node HTTP handler for Jarvis Memory Service REST routes.
 */
export async function handleMemoryHttpRequest(
  service: DefaultMemoryApiService,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const host = req.headers.host ?? "127.0.0.1";
    const url = new URL(req.url ?? "/", `http://${host}`);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    const userId = url.searchParams.get("userId") ?? DEFAULT_USER;

    if (req.method === "GET" && pathname === "/memory/search") {
      const query = url.searchParams.get("q") ?? "";
      const limit = Number(url.searchParams.get("limit") ?? "10");
      const results = await service.searchMemories(userId, query, limit);
      sendJson(res, 200, { results });
      return;
    }

    if (req.method === "GET" && pathname === "/memory/recent") {
      const limit = Number(url.searchParams.get("limit") ?? "10");
      const conversations = await service.getRecentConversations(userId, limit);
      sendJson(res, 200, { conversations });
      return;
    }

    if (req.method === "GET" && pathname === "/memory/facts") {
      const facts = await service.listUserFacts(userId);
      sendJson(res, 200, { facts });
      return;
    }

    if (req.method === "POST" && pathname === "/memory/save") {
      const body = await readJsonBody<{
        content?: string;
        category?: MemoryCategory;
        importance?: number;
        userId?: string;
      }>(req);
      if (!body.content?.trim()) {
        sendJson(res, 400, { error: "content is required" });
        return;
      }
      const record = await service.saveMemoryContent(
        body.userId ?? userId,
        body.content.trim(),
        body.category ?? "fact",
        body.importance ?? 0.5,
      );
      sendJson(res, 201, { record });
      return;
    }

    if (req.method === "POST" && pathname === "/memory/facts") {
      const body = await readJsonBody<{
        key?: string;
        value?: string;
        userId?: string;
      }>(req);
      if (!body.key || !body.value) {
        sendJson(res, 400, { error: "key and value are required" });
        return;
      }
      const fact = await service.saveUserFact(
        body.userId ?? userId,
        body.key,
        body.value,
      );
      sendJson(res, 201, { fact });
      return;
    }

    const deleteMatch = pathname.match(/^\/memory\/([^/]+)$/);
    if (req.method === "DELETE" && deleteMatch?.[1]) {
      const deleted = await service.deleteMemory(deleteMatch[1], userId);
      sendJson(res, deleted ? 200 : 404, { deleted, id: deleteMatch[1] });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    sendJson(res, 500, { error: message });
  }
}
