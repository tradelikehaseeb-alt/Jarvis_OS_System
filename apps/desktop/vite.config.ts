import path from "node:path";

import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";



export default defineConfig({

  plugins: [react()],

  root: path.join(__dirname, "src/renderer"),

  define: {
    __JARVIS_RENDERER__: true,
    global: "globalThis",
    "import.meta.env.VITE_JARVIS_ALLOW_LLM_STUB_FALLBACK": JSON.stringify(
      process.env.JARVIS_ALLOW_LLM_STUB_FALLBACK ?? "false",
    ),
    "import.meta.env.VITE_JARVIS_BROWSER_REAL": JSON.stringify(
      process.env.JARVIS_BROWSER_REAL ?? "false",
    ),
  },

  resolve: {

    alias: {

      "@jarvis/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),

      "@jarvis/speech-service": path.resolve(

        __dirname,

        "../../services/speech-service/src/browser.ts",

      ),

      buffer: "buffer",

    },

  },

  optimizeDeps: {

    include: ["buffer"],

  },

  build: {

    outDir: path.join(__dirname, "dist/renderer"),

    emptyOutDir: true,

  },

  base: "./",

});


