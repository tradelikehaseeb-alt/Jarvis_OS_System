import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/**/*.test.ts",
      "adapter/src/**/*.test.ts",
      "adapter/official/src/**/*.test.ts",
    ],
    environment: "node",
  },
});
