/** Concrete skill ids for agent→skill pipeline (Phase 13). */

export { SEARCH_SKILL_ID } from "@jarvis/search-skill";
export { FILE_SKILL_ID } from "@jarvis/file-skill";
export { BROWSER_SKILL_ID } from "@jarvis/browser-skill";

/** @deprecated Phase 11 pipeline stubs — use concrete skills */
export const HERMES_PLAN_SKILL_STUB = "hermes-plan-stub" as const;
/** @deprecated Phase 11 pipeline stubs — use concrete skills */
export const OPENCLAW_EXECUTE_SKILL_STUB = "openclaw-execute-stub" as const;
