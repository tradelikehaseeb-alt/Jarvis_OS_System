import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, "src/renderer"),
  resolve: {
    alias: {
      "@jarvis/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
      "@jarvis/speech-service": path.resolve(
        __dirname,
        "../../services/speech-service/src/browser.ts",
      ),
    },
  },
  build: {
    outDir: path.join(__dirname, "dist/renderer"),
    emptyOutDir: true,
  },
  base: "./",
});
