import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/** Orchestrator Hermes/OpenClaw stub env + mocked LLM/Serper fetch for integration tests. */
import "../../../../../services/orchestrator/vitest.setup";

afterEach(() => {
  cleanup();
});
