import { ensureElectronMemoryBackend } from "./ensure-electron-memory-backend";
import { loadJarvisEnv, resolveMonorepoRootFromMain } from "./load-env";

/** Monorepo root from `dist/desktop-env-bootstrap.js`. */
export const desktopMonorepoRoot = resolveMonorepoRootFromMain(__dirname);

/** Loaded `.env` path, if any. */
export const desktopLoadedEnvPath = loadJarvisEnv(desktopMonorepoRoot);

ensureElectronMemoryBackend();
