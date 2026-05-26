/**
 * Pull skill-layer payload from agent result for API output (Phase 14).
 * Agents embed skill data under known keys — no skill imports here.
 */
export function extractSkillOutput(
  payload: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> | undefined {
  if (!payload) {
    return undefined;
  }

  if (payload.search !== undefined) {
    return { skillId: "search-skill", data: payload.search };
  }

  if (payload.browser !== undefined || payload.file !== undefined) {
    return {
      skillIds: ["browser-skill", "file-skill"],
      browser: payload.browser,
      file: payload.file,
    };
  }

  return undefined;
}
