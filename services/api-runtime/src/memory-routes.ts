import { createMemoryService } from "@jarvis/memory-service";
import type { DefaultMemoryApiService } from "@jarvis/memory-service";

import type { JarvisApiRouter } from "./jarvis-api-router";

const DEFAULT_USER_ID = "default";

const FALLBACK_FACTS: Readonly<Record<string, string>> = {
  name: "Haseeb Rasheed",
  businesses: "GreenPlus Herbs, Ruby Travel",
  location: "Karachi, Pakistan",
  language: "Roman Urdu + English",
};

let memoryApi: DefaultMemoryApiService | undefined;

function getMemoryApi(): DefaultMemoryApiService {
  if (!memoryApi) {
    memoryApi = createMemoryService({
      env: process.env,
    }) as DefaultMemoryApiService;
  }
  return memoryApi;
}

function envFactOverrides(): Readonly<Record<string, string>> {
  const env = process.env;
  const overrides: Record<string, string> = {};
  if (env.JARVIS_USER_DISPLAY_NAME?.trim()) {
    overrides.name = env.JARVIS_USER_DISPLAY_NAME.trim();
  }
  if (env.JARVIS_USER_LOCATION?.trim()) {
    overrides.location = env.JARVIS_USER_LOCATION.trim();
  }
  return overrides;
}

/**
 * In-memory memory HTTP routes for embedded desktop API (`JARVIS_MEMORY_BACKEND=local`).
 */
export function registerMemoryRoutes(router: JarvisApiRouter): void {
  router.get("/memory/facts", async (request) => {
    const userId = request.query.userId?.trim() || DEFAULT_USER_ID;
    const service = getMemoryApi();
    const stored = await service.listUserFacts(userId);
    const factMap = new Map<string, string>();

    for (const [key, value] of Object.entries(FALLBACK_FACTS)) {
      factMap.set(key, value);
    }
    for (const [key, value] of Object.entries(envFactOverrides())) {
      factMap.set(key, value);
    }
    for (const row of stored) {
      factMap.set(row.key, row.value);
    }

    const facts = [...factMap.entries()].map(([key, value]) => ({ key, value }));
    return {
      status: 200,
      body: { userId, facts },
    };
  });

  router.get("/memory/recent", async (request) => {
    const userId = request.query.userId?.trim() || DEFAULT_USER_ID;
    const limit = Number(request.query.limit ?? "10");
    const conversations = await getMemoryApi().getRecentConversations(userId, limit);
    return {
      status: 200,
      body: { userId, conversations },
    };
  });

  router.get("/memory/search", async (request) => {
    const userId = request.query.userId?.trim() || DEFAULT_USER_ID;
    const query = request.query.q ?? "";
    const limit = Number(request.query.limit ?? "10");
    const results = await getMemoryApi().searchMemories(userId, query, limit);
    return {
      status: 200,
      body: { userId, query, results },
    };
  });
}

export async function countMemoryFacts(userId = DEFAULT_USER_ID): Promise<number> {
  const service = getMemoryApi();
  const facts = await service.listUserFacts(userId);
  return Math.max(facts.length, Object.keys(FALLBACK_FACTS).length);
}
