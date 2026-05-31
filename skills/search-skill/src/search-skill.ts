import {
  AbstractBaseSkill,
  type SkillContext,
  type SkillInput,
  type SkillOutput,
} from "@jarvis/skills-shared";

import { SEARCH_SKILL_ID, SEARCH_SKILL_METADATA } from "./metadata";

const SERPER_ENDPOINT = "https://google.serper.dev/search";

export interface SearchResult {
  readonly title: string;
  readonly url: string;
  readonly snippet: string;
  readonly position: number;
}

interface SerperOrganicItem {
  readonly title?: string;
  readonly link?: string;
  readonly snippet?: string;
  readonly position?: number;
}

async function realSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("SEARCH_KEY_MISSING: Set SERPER_API_KEY in .env");
  }

  const response = await fetch(SERPER_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 5, gl: "us", hl: "en" }),
  });

  if (!response.ok) {
    throw new Error(
      `SEARCH_PROVIDER_ERROR: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as { organic?: readonly SerperOrganicItem[] };
  return (data.organic ?? []).map((item) => ({
    title: item.title ?? "",
    url: item.link ?? "",
    snippet: item.snippet ?? "",
    position: item.position ?? 0,
  }));
}

/**
 * Search skill — Serper web search (fail-closed when SERPER_API_KEY is missing).
 */
export class SearchSkill extends AbstractBaseSkill {
  readonly metadata = SEARCH_SKILL_METADATA;

  async execute(input: SkillInput, _context: SkillContext): Promise<SkillOutput> {
    const query =
      typeof input.parameters.query === "string"
        ? input.parameters.query.trim()
        : "";

    if (query.length === 0) {
      return {
        invocationId: input.invocationId,
        skillId: SEARCH_SKILL_ID,
        success: false,
        error: {
          code: "SEARCH_QUERY_MISSING",
          message: "Search query is required",
        },
      };
    }

    const apiKey = process.env.SERPER_API_KEY?.trim();
    if (!apiKey && process.env.NODE_ENV === "test") {
      return {
        invocationId: input.invocationId,
        skillId: SEARCH_SKILL_ID,
        success: true,
        data: {
          stub: true,
          query,
          results: [
            {
              title: "Stub search result",
              url: "https://stub.local/search",
              snippet: "Test-mode search stub",
              position: 1,
            },
          ],
          total: 1,
        },
      };
    }

    try {
      const results = await realSearch(query);
      return {
        invocationId: input.invocationId,
        skillId: SEARCH_SKILL_ID,
        success: true,
        data: {
          stub: false,
          query,
          results,
          total: results.length,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Search provider request failed";
      const code = message.startsWith("SEARCH_KEY_MISSING")
        ? "SEARCH_KEY_MISSING"
        : message.startsWith("SEARCH_PROVIDER_ERROR")
          ? "SEARCH_PROVIDER_ERROR"
          : "SEARCH_FAILED";

      return {
        invocationId: input.invocationId,
        skillId: SEARCH_SKILL_ID,
        success: false,
        data: {
          stub: false,
          query,
          results: [],
          total: 0,
        },
        error: { code, message },
      };
    }
  }
}
