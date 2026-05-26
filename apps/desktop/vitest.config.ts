import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/renderer/**/*.test.ts", "src/renderer/**/*.test.tsx"],
    setupFiles: ["src/renderer/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@renderer": path.join(__dirname, "src/renderer"),
      "@jarvis/speech-service": path.join(
        __dirname,
        "../speech-service/src/index.ts",
      ),
    },
  },
});
