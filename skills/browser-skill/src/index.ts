import { BrowserSkill } from "./browser-skill";

export { BrowserSkill } from "./browser-skill";
export { BROWSER_SKILL_ID, BROWSER_SKILL_METADATA } from "./metadata";

export function createBrowserSkill(): BrowserSkill {
  return new BrowserSkill();
}
