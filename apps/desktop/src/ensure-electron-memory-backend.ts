import {
  ensureLocalMemoryDirectory,
  resolveLocalMemoryDirectory,
  resolveLocalMemoryFilePath,
} from "@jarvis/local-memory";

/**
 * Electron embeds the orchestrator in-process. Native `better-sqlite3` requires
 * an Electron ABI rebuild (Visual Studio on Windows). Use `@jarvis/local-memory`
 * JSON file storage under `JARVIS_MEMORY_PATH` instead of SQLite in the shell.
 */
export function ensureElectronMemoryBackend(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (!process.versions.electron) {
    return;
  }

  env.JARVIS_MEMORY_BACKEND = "local";

  const inMemoryFlag = env.MEMORY_USE_IN_MEMORY_STORAGE?.trim().toLowerCase();
  env.MEMORY_USE_IN_MEMORY_STORAGE = inMemoryFlag === "true" ? "true" : "false";

  const memoryDirectory = ensureLocalMemoryDirectory(resolveLocalMemoryDirectory(env));
  env.JARVIS_MEMORY_PATH = memoryDirectory;

  const useInMemory = env.MEMORY_USE_IN_MEMORY_STORAGE === "true";
  const memoryFilePath = useInMemory ? undefined : resolveLocalMemoryFilePath(env);

  console.info(
    `[jarvis] Electron memory: backend=local storage=${
      useInMemory ? "in-memory" : "file"
    } path=${memoryDirectory}${
      memoryFilePath ? ` file=${memoryFilePath}` : ""
    }`,
  );
}
