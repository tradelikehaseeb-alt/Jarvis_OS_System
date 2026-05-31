import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/renderer/**/*.test.ts", "src/renderer/**/*.test.tsx"],
    setupFiles: ["src/renderer/test/setup.ts"],
    /** Avoid orchestrator global/env pollution across integration suites. */
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@renderer": path.join(__dirname, "src/renderer"),
      "@jarvis/speech-service": path.join(
        __dirname,
        "../../services/speech-service/src/browser.ts",
      ),
      "@jarvis/api-runtime": path.join(
        __dirname,
        "../../services/api-runtime/src/index.ts",
      ),
      "@jarvis/orchestrator": path.join(
        __dirname,
        "../../services/orchestrator/src/index.ts",
      ),
      "@jarvis/runtime-process": path.join(
        __dirname,
        "../../services/runtime-process/src/index.ts",
      ),
    },
  },
});
