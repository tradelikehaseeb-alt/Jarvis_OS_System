import type { SkillCapability } from "./skill-capability";

/**
 * Hermes fallback when no static Jarvis skill exists — dynamic Windows Python
 * via `execute_dynamic_windows_script` in the Hermes agent subprocess.
 */
export const HERMES_DYNAMIC_WINDOWS_AUTOMATION_CAPABILITY: SkillCapability = {
  id: "hermes-dynamic-windows-script",
  kind: "automate",
  description:
    "Hermes execute_dynamic_windows_script — native Windows Python automation for desktop control, file moves, and UI actions",
};
