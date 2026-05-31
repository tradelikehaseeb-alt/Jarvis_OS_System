import { SearchSkill } from "./search-skill";

export { SearchSkill, type SearchResult } from "./search-skill";
export { SEARCH_SKILL_ID, SEARCH_SKILL_METADATA } from "./metadata";

export function createSearchSkill(): SearchSkill {
  return new SearchSkill();
}
