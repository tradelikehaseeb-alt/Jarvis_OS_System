import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@jarvis/desktop-intent": path.resolve(
        root,
        "../../apps/desktop/src/renderer/intent/index.ts",
      ),
      "@jarvis/local-memory": path.resolve(
        root,
        "../local-memory/src/index.ts",
      ),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
