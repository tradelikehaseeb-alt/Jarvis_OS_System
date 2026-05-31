import {
  AbstractBaseSkill,
  type SkillContext,
  type SkillInput,
  type SkillOutput,
} from "@jarvis/skills-shared";

import {
  createWorkspaceDirectory,
  deleteWorkspaceFile,
  listWorkspaceDirectory,
  readWorkspaceFile,
  searchWorkspaceFiles,
  writeWorkspaceFile,
} from "./file-operations";
import { ensureWorkspaceExists } from "./workspace-path";
import { FILE_SKILL_ID, FILE_SKILL_METADATA } from "./metadata";

const FILE_INTENT_PATTERN =
  /\b(create|read|write|save|list|find|search|delete)\b.*\b(file|files|folder|directory|dir)\b/i;

function normalizeOperation(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value === "save") {
    return "write";
  }
  if (value === "find" || value === "search") {
    return "search";
  }
  if (value === "create" && !value.includes("dir")) {
    return "write";
  }
  if (value === "list") {
    return "list";
  }
  if (value === "mkdir" || value === "createDir" || value === "create_dir") {
    return "mkdir";
  }
  return value;
}

/**
 * File skill — real workspace file operations under JARVIS_WORKSPACE_PATH.
 */
export class FileSkill extends AbstractBaseSkill {
  readonly metadata = FILE_SKILL_METADATA;

  async execute(input: SkillInput, _context: SkillContext): Promise<SkillOutput> {
    ensureWorkspaceExists();

    const operation = normalizeOperation(
      typeof input.parameters.operation === "string"
        ? input.parameters.operation
        : "read",
    );
    const path =
      typeof input.parameters.path === "string"
        ? input.parameters.path
        : typeof input.parameters.file === "string"
          ? input.parameters.file
          : ".";
    const content =
      typeof input.parameters.content === "string"
        ? input.parameters.content
        : "";
    const query =
      typeof input.parameters.query === "string"
        ? input.parameters.query
        : path;

    try {
      let result: Record<string, unknown>;

      switch (operation) {
        case "read":
          result = { ...readWorkspaceFile(path), status: "ok" };
          break;
        case "write":
          result = { ...writeWorkspaceFile(path, content), status: "ok" };
          break;
        case "list":
          result = { ...listWorkspaceDirectory(path), status: "ok" };
          break;
        case "delete":
          result = { ...deleteWorkspaceFile(path), status: "ok" };
          break;
        case "mkdir":
          result = { ...createWorkspaceDirectory(path), status: "ok" };
          break;
        case "search":
          result = { ...searchWorkspaceFiles(query), status: "ok" };
          break;
        default:
          return {
            invocationId: input.invocationId,
            skillId: FILE_SKILL_ID,
            success: false,
            error: {
              code: "UNSUPPORTED_OPERATION",
              message: `Unsupported file operation: ${operation}`,
            },
          };
      }

      return {
        invocationId: input.invocationId,
        skillId: FILE_SKILL_ID,
        success: true,
        data: {
          stub: false,
          operation,
          path,
          result,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        invocationId: input.invocationId,
        skillId: FILE_SKILL_ID,
        success: false,
        error: { code: message, message },
        data: {
          stub: false,
          operation,
          path,
        },
      };
    }
  }

  /** Whether transcript text should route to file skill. */
  static matchesIntent(text: string): boolean {
    return FILE_INTENT_PATTERN.test(text);
  }
}
