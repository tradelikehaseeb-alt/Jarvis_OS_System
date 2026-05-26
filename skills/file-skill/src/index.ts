import { FileSkill } from "./file-skill";

export { FileSkill } from "./file-skill";
export { FILE_SKILL_ID, FILE_SKILL_METADATA } from "./metadata";

export function createFileSkill(): FileSkill {
  return new FileSkill();
}
